package com.pos.backend.service.POS;

import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.EventType;
import com.pos.backend.constant.enums.ItemStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import com.pos.backend.constant.enums.KitchenStatus;
import com.pos.backend.constant.enums.OrderItemStatus;
import com.pos.backend.constant.enums.OrderPaymentStatus;
import com.pos.backend.constant.enums.OrderStatus;
import com.pos.backend.constant.enums.OrderType;
import com.pos.backend.constant.enums.TableStatus;
import com.pos.backend.dto.request.POS.CreateCustomerRequest;
import com.pos.backend.dto.request.POS.CreateOrderItemAddonRequest;
import com.pos.backend.dto.request.POS.CreateOrderItemRequest;
import com.pos.backend.dto.request.POS.CreateOrderRequest;
import com.pos.backend.entity.OrderItemAddon;
import com.pos.backend.dto.response.Common.OptionResponse;
import com.pos.backend.dto.response.Item.ItemAddonResponse;
import com.pos.backend.dto.response.Item.ItemVariationResponse;
import com.pos.backend.dto.response.Order.OrderResponse;
import com.pos.backend.dto.response.POS.POSItemResponse;
import com.pos.backend.dto.response.Table.TableResponse;
import com.pos.backend.entity.Addon;
import com.pos.backend.entity.Customer;
import com.pos.backend.entity.Item;
import com.pos.backend.entity.ItemVariation;
import com.pos.backend.entity.Order;
import com.pos.backend.entity.OrderItem;
import com.pos.backend.entity.OrderSequence;
import com.pos.backend.entity.RestaurantTable;
import com.pos.backend.entity.User;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.AddonRepository;
import com.pos.backend.repository.CustomerRepository;
import com.pos.backend.repository.ItemRepository;
import com.pos.backend.repository.ItemVariationRepository;
import com.pos.backend.repository.OrderItemAddonRepository;
import com.pos.backend.repository.OrderItemRepository;
import com.pos.backend.repository.OrderRepository;
import com.pos.backend.repository.OrderSequenceRepository;
import com.pos.backend.repository.RestaurantTableRepository;
import com.pos.backend.repository.UserRepository;
import com.pos.backend.service.NotificationService;
import com.pos.backend.service.WebSocket.WebSocketService;
import com.pos.backend.util.POS;
import com.pos.backend.ws.WebSocketEvent;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class POSService {

    OrderRepository orderRepository;
    ItemRepository itemRepository;
    ItemVariationRepository itemVariationRepository;
    AddonRepository addonRepository;
    OrderItemRepository orderItemRepository;
    UserRepository userRepository;
    CustomerRepository customerRepository;
    OrderItemAddonRepository orderItemAddonRepository;
    RestaurantTableRepository restaurantTableRepository;
    OrderSequenceRepository orderSequenceRepository;
    WebSocketService webSocketService;
    NotificationService notificationService;

    public Page<OrderResponse> getListRecentOrder(Pageable pageable) {

        Page<Order> orders = orderRepository.findAll(pageable);

        return orders.map(order -> OrderResponse.builder()
                .id(order.getId())
                .estimatedMinutes(order.getEstimatedMinutes() != null ? order.getEstimatedMinutes()
                        : null)
                .tableNumber(order.getTable() != null ? order.getTable().getTableNumber() : null)
                .kitchenStatus(order.getKitchenStatus().name())
                .orderNumber(order.getOrderNumber())
                .customerName(customerDisplayName(order))
                .orderType(order.getOrderType().name())
                .orderedAt(order.getOrderedAt())
                .build());
    }

    @Transactional(readOnly = true)
    public List<POSItemResponse> getItemsByCategory(Long categoryId) {
        // 1. Fetch only active items by category
        List<Item> items;
        if (categoryId == null || categoryId == 0) {
            items = itemRepository.findAll().stream()
                    .filter(i -> i.getStatus() == ItemStatus.active)
                    .toList();
        } else {
            items = itemRepository.findByCategory_Id(categoryId).stream()
                    .filter(i -> i.getStatus() == ItemStatus.active)
                    .toList();
        }

        if (items.isEmpty()) {
            return List.of();
        }

        List<Long> itemIds = items.stream().map(Item::getId).toList();

        // 2. Batch-load variations and addons, grouped by item ID
        Map<Long, List<ItemVariation>> variationsByItemId = itemVariationRepository
                .findByItem_IdInOrderByItem_IdAscIdAsc(itemIds)
                .stream()
                .collect(Collectors.groupingBy(
                        v -> v.getItem().getId(),
                        Collectors.mapping(Function.identity(), Collectors.toList())));

        Map<Long, List<Addon>> addonsByItemId = addonRepository
                .findByItem_IdInOrderByItem_IdAscIdAsc(itemIds)
                .stream()
                .collect(Collectors.groupingBy(
                        a -> a.getItem().getId(),
                        Collectors.mapping(Function.identity(), Collectors.toList())));

        // 3. Count order frequency for popularity badges
        List<Object[]> frequencyRows = orderItemRepository.countOrderFrequencyByItemIds(itemIds);
        Map<Long, Long> orderCountMap = frequencyRows.stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]));

        // 4. Sort items by order count desc, assign badges
        List<Long> sortedByFrequency = itemIds.stream()
                .sorted(Comparator.comparingLong(id -> -orderCountMap.getOrDefault(id, 0L)))
                .toList();

        int total = sortedByFrequency.size();
        int trendingThreshold = Math.max(1, (int) Math.ceil(total * 0.2));
        int mustTryThreshold = Math.max(trendingThreshold + 1, (int) Math.ceil(total * 0.5));

        Map<Long, String> badgeMap = new java.util.HashMap<>();
        for (int i = 0; i < total; i++) {
            Long id = sortedByFrequency.get(i);
            long count = orderCountMap.getOrDefault(id, 0L);
            if (count == 0)
                continue;
            if (i < trendingThreshold) {
                badgeMap.put(id, "trending");
            } else if (i < mustTryThreshold) {
                badgeMap.put(id, "must_try");
            }
        }

        // 5. Build response using batch-loaded data
        return items.stream()
                .map(item -> buildPOSItemResponse(item,
                        variationsByItemId.getOrDefault(item.getId(), List.of()),
                        addonsByItemId.getOrDefault(item.getId(), List.of()),
                        badgeMap))
                .toList();
    }

    private POSItemResponse buildPOSItemResponse(
            Item item,
            List<ItemVariation> variations,
            List<Addon> addons,
            Map<Long, String> badgeMap) {

        List<ItemVariationResponse> variationResponses = variations.stream()
                .map(v -> ItemVariationResponse.builder()
                        .id(v.getId())
                        .sizeName(v.getSizeName())
                        .price(v.getPrice())
                        .build())
                .toList();

        List<ItemAddonResponse> addonResponses = addons.stream()
                .map(a -> ItemAddonResponse.builder()
                        .id(a.getId())
                        .name(a.getName())
                        .price(a.getPrice())
                        .description(a.getDescription())
                        .build())
                .toList();

        String badge = badgeMap.getOrDefault(item.getId(), null);

        return POSItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .description(item.getDescription())
                .imagePath(item.getImagePath())
                .price(item.getPrice())
                .netPrice(item.getNetPrice())
                .foodType(item.getFoodType().name())
                .categoryId(item.getCategory().getId())
                .categoryName(item.getCategory().getName())
                .taxId(item.getTax() != null ? item.getTax().getId() : null)
                .taxTitle(item.getTax() != null ? item.getTax().getTitle() : null)
                .taxRate(item.getTax() != null ? item.getTax().getTaxRate() : null)
                .variations(variationResponses)
                .addons(addonResponses)
                .badge(badge)
                .build();
    }

    @Transactional(readOnly = true)
    public List<TableResponse> getAvailableTables() {
        return restaurantTableRepository.findAll().stream()
                .filter(table -> table
                        .getStatus() == com.pos.backend.constant.enums.TableStatus.available
                        || table.getStatus() == com.pos.backend.constant.enums.TableStatus.booked)
                .map(table -> TableResponse.builder()
                        .id(table.getId())
                        .name(table.getTableNumber())
                        .seats(table.getSeats())
                        .areaName(table.getArea() != null ? table.getArea().getName() : null)
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OptionResponse> getWaiters() {
        return userRepository.findAll().stream()
                .map(user -> OptionResponse.builder()
                        .id(user.getId())
                        .name(user.getFirstName() + " " + user.getLastName())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OptionResponse> getCustomers() {
        return customerRepository.findAll().stream()
                .map(customer -> OptionResponse.builder()
                        .id(customer.getId())
                        .name(customer.getName())
                        .build())
                .toList();
    }

    @Transactional
    public Customer createCustomer(CreateCustomerRequest request) {
        Customer customer = Customer.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .gender(request.getGender())
                .build();
        customer = customerRepository.save(customer);

        notificationService.notifyCustomerEvent(
                "New Customer",
                "New customer \"" + customer.getName() + "\" was registered - Phone: " + customer.getPhone(),
                customer.getId());

        return customer;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {

        OrderReferenceMaps maps = loadReferenceMaps(request);

        // Build & save Order
        Order order = buildOrder(request, maps);

        changeTableStatus(order.getTable() != null ? order.getTable().getId() : null);
        // Save OrderItems and OrderItemAddons
        saveOrderItem(order, maps, request);

        // Publish real-time event + notification
        OrderResponse response = buildOrderResponse(order);
        publishOrderEvent(EventType.ORDER_CREATED, response, "New Order",
                "Order #" + order.getOrderNumber() + " was created by " + customerDisplayName(order)
                        + " - Total: $" + order.getGrandTotal());

        return response;
    }

    private Order buildOrder(CreateOrderRequest request, OrderReferenceMaps maps) {
        OrderEntities entities = resolveOrderEntities(request);
        validateDineInOrder(request.getOrderType(), entities.table(), entities.waiter());

        OrderTotals totals = calculateTotals(request, maps);

        Order order = Order.builder()
                .orderNumber("ORD-" + System.currentTimeMillis())
                .tokenNo(generateOrderToken())
                .orderType(OrderType.valueOf(request.getOrderType()))
                .customer(entities.customer())
                .waiter(entities.waiter())
                .table(entities.table())
                .status(OrderStatus.pending)
                .kitchenStatus(KitchenStatus.new_order)
                .subtotal(totals.subtotal())
                .taxAmount(totals.taxAmount())
                .serviceCharge(totals.serviceCharge())
                .deliveryCharge(totals.deliveryCharge())
                .grandTotal(totals.grandTotal())
                .paymentStatus(OrderPaymentStatus.unpaid)
                .note(request.getNote())
                .orderedAt(LocalDateTime.now())
                .build();

        return orderRepository.save(order);
    }

    private void saveOrderItem(Order order, OrderReferenceMaps maps, CreateOrderRequest request) {
        for (CreateOrderItemRequest itemReq : request.getItems()) {
            createOrderItem(order, itemReq, maps);
        }
    }

    private OrderItem createOrderItem(Order order, CreateOrderItemRequest itemReq, OrderReferenceMaps maps) {
        Item item = maps.items().get(itemReq.getItemId());
        ItemVariation variation = maps.variations().get(itemReq.getVariationId());

        if (item == null) {
            throw new AppException(ErrorCode.ITEM_NOT_FOUND);
        }

        if (variation != null && !variation.getItem().getId().equals(item.getId())) {
            throw new AppException(ErrorCode.INVALID_VARIATION_OR_ADDON_DATA);
        }

        OrderItem orderItem = OrderItem.builder()
                .order(order)
                .item(item)
                .variation(variation)
                .itemName(itemReq.getItemName())
                .unitPrice(itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : BigDecimal.ZERO)
                .quantity(itemReq.getQuantity() != null ? itemReq.getQuantity() : 1)
                .lineTotal(itemReq.getLineTotal() != null ? itemReq.getLineTotal() : BigDecimal.ZERO)
                .kitchenNote(itemReq.getKitchenNote())
                .build();

        orderItemRepository.save(orderItem);
        saveItemAddons(itemReq, maps.addons(), orderItem);
        return orderItem;
    }

    /**
     * Merge the incoming cart into the order's existing items instead of
     * deleting and recreating everything:
     * <ul>
     * <li>lines that still exist (same item + variation + addons) are updated
     * in place — preserving their id and kitchen status;</li>
     * <li>brand-new lines are created;</li>
     * <li>removed lines are marked {@code cancelled} so the kitchen &amp; order
     * history keep a record of what was ordered.</li>
     * </ul>
     */
    private void syncOrderItems(Order order, List<CreateOrderItemRequest> itemRequests, OrderReferenceMaps maps,
            List<OrderItem> existingItems, Map<Long, List<OrderItemAddon>> existingAddonsByItemId) {

        Map<String, OrderItem> existingByKey = new HashMap<>();
        for (OrderItem item : existingItems) {
            String key = buildExistingItemKey(item, existingAddonsByItemId.getOrDefault(item.getId(), List.of()));
            existingByKey.put(key, item);
        }

        Set<Long> keptItemIds = new HashSet<>();

        for (CreateOrderItemRequest itemReq : itemRequests) {
            String key = buildRequestItemKey(itemReq);
            OrderItem existing = existingByKey.remove(key);

            if (existing != null) {
                // Update the existing line in place — id & kitchen status survive
                existing.setUnitPrice(itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : BigDecimal.ZERO);
                existing.setQuantity(itemReq.getQuantity() != null ? itemReq.getQuantity() : 1);
                existing.setLineTotal(itemReq.getLineTotal() != null ? itemReq.getLineTotal() : BigDecimal.ZERO);
                existing.setKitchenNote(itemReq.getKitchenNote());
                // If it was cancelled in a previous edit and is re-added, revive it
                if (existing.getStatus() == OrderItemStatus.cancelled) {
                    existing.setStatus(OrderItemStatus.pending);
                }
                orderItemRepository.save(existing);
                keptItemIds.add(existing.getId());
            } else {
                OrderItem created = createOrderItem(order, itemReq, maps);
                keptItemIds.add(created.getId());
            }
        }

        // Lines removed from the order are cancelled (kept in DB for history)
        for (OrderItem item : existingItems) {
            if (!keptItemIds.contains(item.getId()) && item.getStatus() != OrderItemStatus.cancelled) {
                item.setStatus(OrderItemStatus.cancelled);
                orderItemRepository.save(item);
            }
        }
    }

    private String buildRequestItemKey(CreateOrderItemRequest itemReq) {
        String addonKey = itemReq.getAddons() == null || itemReq.getAddons().isEmpty()
                ? "no-addons"
                : itemReq.getAddons().stream()
                        .sorted(Comparator.comparing(CreateOrderItemAddonRequest::getAddonId))
                        .map(a -> a.getAddonId() + "x" + (a.getQuantity() == null ? 1 : a.getQuantity()))
                        .collect(Collectors.joining("-"));
        return itemReq.getItemId() + "-"
                + (itemReq.getVariationId() == null ? "base" : itemReq.getVariationId())
                + "-" + addonKey;
    }

    private String buildExistingItemKey(OrderItem item, List<OrderItemAddon> addons) {
        String addonKey = addons.isEmpty()
                ? "no-addons"
                : addons.stream()
                        .sorted(Comparator.comparing(a -> a.getAddon() != null ? a.getAddon().getId() : 0L))
                        .map(a -> (a.getAddon() != null ? a.getAddon().getId() : 0L)
                                + "x" + (a.getQuantity() == null ? 1 : a.getQuantity()))
                        .collect(Collectors.joining("-"));
        Long variationId = item.getVariation() != null ? item.getVariation().getId() : null;
        return item.getItem().getId() + "-"
                + (variationId == null ? "base" : variationId)
                + "-" + addonKey;
    }

    private void saveItemAddons(CreateOrderItemRequest itemReq, Map<Long, Addon> addonMap, OrderItem orderItem) {

        if (itemReq.getAddons() == null || itemReq.getAddons().isEmpty()) {
            return;
        }

        for (CreateOrderItemAddonRequest addonReq : itemReq.getAddons()) {

            Addon addon = addonMap.get(addonReq.getAddonId());

            if (addon == null) {
                throw new AppException(ErrorCode.ADDON_NOT_FOUND);
            }
            OrderItemAddon orderItemAddon = OrderItemAddon.builder()
                    .orderItem(orderItem)
                    .addon(addon)
                    .addonName(addonReq.getAddonName())
                    .addonPrice(addonReq.getAddonPrice())
                    .quantity(addonReq.getQuantity() != null ? addonReq.getQuantity() : 0)
                    .build();

            orderItemAddonRepository.save(orderItemAddon);
        }
    }

    @Transactional
    public OrderResponse updateOrder(String orderNumber, CreateOrderRequest request) {

        // 1. Find existing order
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        validateOrderEditable(order);

        // 2. Load existing order items & addons so we can merge (not wipe) them
        List<OrderItem> existingItems = orderItemRepository.findByOrderId(order.getId());
        Map<Long, List<OrderItemAddon>> existingAddonsByItemId = loadAddonsGroupedByItemId(existingItems);

        // 3. Load new item/variation/addon data
        OrderReferenceMaps maps = loadReferenceMaps(request);

        // 4. Update order fields
        OrderEntities entities = resolveOrderEntities(request);
        validateDineInOrder(request.getOrderType(), entities.table(), entities.waiter());
        swapTableIfChanged(order, entities.table());

        OrderTotals totals = calculateTotals(request, maps);

        order.setOrderType(OrderType.valueOf(request.getOrderType()));
        order.setCustomer(entities.customer());
        order.setWaiter(entities.waiter());
        order.setTable(entities.table());
        order.setSubtotal(totals.subtotal());
        order.setTaxAmount(totals.taxAmount());
        order.setServiceCharge(totals.serviceCharge());
        order.setDeliveryCharge(totals.deliveryCharge());
        order.setGrandTotal(totals.grandTotal());
        order.setNote(request.getNote());
        // Reset discount/coupon when editing
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setDiscountType(null);
        order.setCoupon(null);
        // Keep original orderedAt, status, kitchenStatus

        orderRepository.save(order);

        // 5. Merge order items: update existing lines, create new ones,
        // and mark removed lines as cancelled (keeps kitchen state & history)
        syncOrderItems(order, request.getItems(), maps, existingItems, existingAddonsByItemId);

        // 6. Return response
        OrderResponse response = buildOrderResponse(order);
        publishOrderEvent(EventType.ORDER_UPDATED, response, "Order Updated",
                "Order #" + order.getOrderNumber() + " has been updated - Total: $" + order.getGrandTotal());

        return response;
    }

    /* ------------------------------------------------------------------ */
    /* Shared helpers */
    /* ------------------------------------------------------------------ */

    private OrderReferenceMaps loadReferenceMaps(CreateOrderRequest request) {
        Set<Long> itemIds = request.getItems().stream().map(item -> item.getItemId())
                .collect(Collectors.toSet());

        Set<Long> variationIds = request.getItems().stream().map(item -> item.getVariationId())
                .collect(Collectors.toSet());

        Set<Long> addonIds = request.getItems().stream().filter(item -> item.getAddons() != null)
                .flatMap(item -> item.getAddons().stream()).map(addon -> addon.getAddonId())
                .collect(Collectors.toSet());

        Map<Long, Item> itemMap = itemRepository.findAllById(itemIds).stream()
                .collect(Collectors.toMap(Item::getId, Function.identity()));

        Map<Long, ItemVariation> variationMap = itemVariationRepository.findAllWithItemByIdIn(variationIds)
                .stream()
                .collect(Collectors.toMap(ItemVariation::getId, Function.identity()));

        Map<Long, Addon> addonMap = addonRepository.findAllById(addonIds).stream()
                .collect(Collectors.toMap(addon -> addon.getId(), Function.identity()));

        return new OrderReferenceMaps(itemMap, variationMap, addonMap);
    }

    private OrderEntities resolveOrderEntities(CreateOrderRequest request) {
        Customer customer = request.getCustomerId() != null
                ? customerRepository.findById(request.getCustomerId())
                        .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND))
                : null;

        User waiter = request.getWaiterId() != null
                ? userRepository.findById(request.getWaiterId())
                        .orElseThrow(() -> new AppException(ErrorCode.WAITER_NOT_FOUND))
                : null;

        RestaurantTable table = request.getTableId() != null
                ? restaurantTableRepository.findById(request.getTableId())
                        .orElseThrow(() -> new AppException(ErrorCode.TABLE_NOT_FOUND))
                : null;

        return new OrderEntities(customer, waiter, table);
    }

    private void validateDineInOrder(String orderType, RestaurantTable table, User waiter) {
        if (orderType.equals(OrderType.dine_in.name()) && table == null) {
            throw new AppException(ErrorCode.NO_TABLE_CHOOSE_FOR_DINE_IN);
        }
        if (orderType.equals(OrderType.dine_in.name()) && waiter == null) {
            throw new AppException(ErrorCode.NO_WAITER_CHOOSE_FOR_DINE_IN);
        }
    }

    private OrderTotals calculateTotals(CreateOrderRequest request, OrderReferenceMaps maps) {
        BigDecimal subTotal = POS.calSubTotal(request, maps.items(), maps.variations(), maps.addons());
        BigDecimal taxAmount = POS.getTaxAmount(request, maps.items(), maps.variations(), maps.addons());
        BigDecimal serviceCharge = request.getServiceCharge() != null
                ? request.getServiceCharge()
                : BigDecimal.ZERO;
        BigDecimal deliveryCharge = request.getDeliveryCharge() != null
                ? request.getDeliveryCharge()
                : BigDecimal.ZERO;
        BigDecimal grandTotal = subTotal
                .add(taxAmount)
                .add(serviceCharge)
                .add(deliveryCharge);
        return new OrderTotals(subTotal, taxAmount, serviceCharge, deliveryCharge, grandTotal);
    }

    private String customerDisplayName(Order order) {
        return order.getCustomer() != null ? order.getCustomer().getName() : "Walk In Customer";
    }

    private OrderResponse buildOrderResponse(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .orderType(order.getOrderType().name())
                .status(order.getStatus().name())
                .kitchenStatus(order.getKitchenStatus().name())
                .subtotal(order.getSubtotal())
                .taxAmount(order.getTaxAmount())
                .serviceCharge(order.getServiceCharge())
                .grandTotal(order.getGrandTotal())
                .paymentStatus(order.getPaymentStatus().name())
                .note(order.getNote())
                .orderedAt(order.getOrderedAt())
                .build();
    }

    private void publishOrderEvent(EventType type, OrderResponse response, String title, String message) {
        webSocketService.sendTopic("/orders", WebSocketEvent.builder()
                .type(type)
                .data(response)
                .build());
        notificationService.notifyOrderEvent(title, message, response.getId());
    }

    private void validateOrderEditable(Order order) {
        if (order.getPaymentStatus() != OrderPaymentStatus.unpaid
                || order.getStatus() == OrderStatus.served
                || order.getStatus() == OrderStatus.delivered
                || order.getStatus() == OrderStatus.completed
                || order.getStatus() == OrderStatus.cancelled) {
            throw new AppException(ErrorCode.ORDER_CANNOT_BE_EDITED);
        }
    }

    private Map<Long, List<OrderItemAddon>> loadAddonsGroupedByItemId(List<OrderItem> existingItems) {
        if (existingItems.isEmpty()) {
            return Map.of();
        }
        return orderItemAddonRepository
                .findByOrderItemIdIn(existingItems.stream().map(OrderItem::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(a -> a.getOrderItem().getId()));
    }

    private void swapTableIfChanged(Order order, RestaurantTable newTable) {
        RestaurantTable oldTable = order.getTable();
        if (oldTable != null && (newTable == null || !oldTable.getId().equals(newTable.getId()))) {
            oldTable.setStatus(TableStatus.available);
            restaurantTableRepository.save(oldTable);
        }
        if (newTable != null && (oldTable == null || !newTable.getId().equals(oldTable.getId()))) {
            newTable.setStatus(TableStatus.occupied);
            restaurantTableRepository.save(newTable);
        }
    }

    private void changeTableStatus(Long tableId) {
        if (tableId == null)
            return;
        RestaurantTable table = restaurantTableRepository.findById(tableId)
                .orElseThrow(() -> new AppException(ErrorCode.TABLE_NOT_FOUND));

        table.setStatus(TableStatus.occupied);
        restaurantTableRepository.save(table);
    }

    private record OrderReferenceMaps(
            Map<Long, Item> items,
            Map<Long, ItemVariation> variations,
            Map<Long, Addon> addons) {
    }

    private record OrderEntities(Customer customer, User waiter, RestaurantTable table) {
    }

    private record OrderTotals(BigDecimal subtotal, BigDecimal taxAmount,
            BigDecimal serviceCharge, BigDecimal deliveryCharge, BigDecimal grandTotal) {
    }

    private String generateOrderToken() {
        LocalDate today = LocalDate.now();

        OrderSequence sequence = orderSequenceRepository.findBySequenceDateForUpdate(today)
                .orElseGet(() -> OrderSequence.builder()
                        .sequenceDate(today)
                        .lastNumber(0)
                        .build());

        sequence.setLastNumber(sequence.getLastNumber() + 1);
        orderSequenceRepository.save(sequence);

        return today.format(DateTimeFormatter.BASIC_ISO_DATE)
                + "-"
                + String.format("%04d", sequence.getLastNumber());
    }
}
