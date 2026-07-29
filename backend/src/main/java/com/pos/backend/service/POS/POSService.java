package com.pos.backend.service.POS;

import java.util.Comparator;
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

    public Page<OrderResponse> getListRecentOrder(Pageable pageable) {

        Page<Order> orders = orderRepository.findAll(pageable);

        return orders.map(order -> OrderResponse.builder()
                .id(order.getId())
                .estimatedMinutes(order.getEstimatedMinutes() != null ? order.getEstimatedMinutes()
                        : null)
                .tableNumber(order.getTable() != null ? order.getTable().getTableNumber() : null)
                .kitchenStatus(order.getKitchenStatus().name())
                .orderNumber(order.getOrderNumber())
                .customerName(order.getCustomer() != null ? order.getCustomer().getName()
                        : "Walk In Customer")
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
                        .getStatus() == com.pos.backend.constant.enums.TableStatus.available)
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
        return customerRepository.save(customer);
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {

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

        // 3. Build & save Order
        Order order = buildOrder(request, itemMap, variationMap, addonMap);

        changeTableStatus(order.getTable() != null ? order.getTable().getId() : null);
        // 4. Save OrderItems and OrderItemAddons
        saveOrderItem(order, itemMap, variationMap, addonMap, request);

        // 6. Return response (without items list for simplicity)

        OrderResponse response = OrderResponse.builder()
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

        webSocketService.sendTopic("/orders", WebSocketEvent.builder()
                .type(EventType.ORDER_CREATED)
                .data(response)
                .build());
        return response;
    }

    private Order buildOrder(CreateOrderRequest request, Map<Long, Item> itemMap,
            Map<Long, ItemVariation> variationMap,
            Map<Long, Addon> addonMap) {
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

        if (request.getOrderType().equals(OrderType.dine_in.name()) && table == null) {
            throw new AppException(ErrorCode.NO_TABLE_CHOOSE_FOR_DINE_IN);
        }
        if (request.getOrderType().equals(OrderType.dine_in.name()) && waiter == null) {
            throw new AppException(ErrorCode.NO_WAITER_CHOOSE_FOR_DINE_IN);
        }

        String orderNumber = "ORD-" + System.currentTimeMillis();

        BigDecimal subTotal = POS.calSubTotal(request, itemMap, variationMap, addonMap);
        BigDecimal taxAmount = POS.getTaxAmount(request, itemMap, variationMap, addonMap);
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
        String tokenNo = generateOrderToken();

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .tokenNo(tokenNo)
                .orderType(OrderType.valueOf(request.getOrderType()))
                .customer(customer)
                .waiter(waiter)
                .table(table)
                .status(OrderStatus.pending)
                .kitchenStatus(KitchenStatus.new_order)
                .subtotal(subTotal)
                .taxAmount(taxAmount)
                .serviceCharge(serviceCharge)
                .deliveryCharge(deliveryCharge)
                .grandTotal(grandTotal)
                .paymentStatus(OrderPaymentStatus.unpaid)
                .note(request.getNote())
                .orderedAt(LocalDateTime.now())
                .build();

        return orderRepository.save(order);

    }

    private void saveOrderItem(Order order, Map<Long, Item> itemMap,
            Map<Long, ItemVariation> variationMap, Map<Long, Addon> addonMap, CreateOrderRequest request) {

        for (CreateOrderItemRequest itemReq : request.getItems()) {
            Item item = itemMap.get(itemReq.getItemId());
            ItemVariation variation = variationMap.get(itemReq.getVariationId());

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
                    .unitPrice(itemReq.getUnitPrice() != null ? itemReq.getUnitPrice()
                            : BigDecimal.ZERO)
                    .quantity(itemReq.getQuantity() != null ? itemReq.getQuantity() : 1)
                    .lineTotal(itemReq.getLineTotal() != null ? itemReq.getLineTotal()
                            : BigDecimal.ZERO)
                    .kitchenNote(itemReq.getKitchenNote())
                    .build();

            orderItemRepository.save(orderItem);

            saveItemAddons(itemReq, addonMap, orderItem);
        }
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

        // Only unpaid pending orders can be edited
        if (order.getStatus() != OrderStatus.pending
                || order.getPaymentStatus() != OrderPaymentStatus.unpaid) {
            throw new AppException(ErrorCode.ORDER_CANNOT_BE_EDITED);
        }

        // 2. Delete existing order items and their addons
        List<OrderItem> existingItems = orderItemRepository.findByOrderId(order.getId());
        if (!existingItems.isEmpty()) {
            List<Long> existingItemIds = existingItems.stream()
                    .map(OrderItem::getId)
                    .toList();
            List<OrderItemAddon> existingAddons = orderItemAddonRepository
                    .findByOrderItemIdIn(existingItemIds);
            if (!existingAddons.isEmpty()) {
                orderItemAddonRepository.deleteAll(existingAddons);
            }
            orderItemRepository.deleteAll(existingItems);
        }

        // 3. Load new item/variation/addon data
        Set<Long> itemIds = request.getItems().stream()
                .map(CreateOrderItemRequest::getItemId)
                .collect(Collectors.toSet());

        Set<Long> variationIds = request.getItems().stream()
                .map(CreateOrderItemRequest::getVariationId)
                .collect(Collectors.toSet());

        Set<Long> addonIds = request.getItems().stream()
                .filter(item -> item.getAddons() != null)
                .flatMap(item -> item.getAddons().stream())
                .map(CreateOrderItemAddonRequest::getAddonId)
                .collect(Collectors.toSet());

        Map<Long, Item> itemMap = itemRepository.findAllById(itemIds).stream()
                .collect(Collectors.toMap(Item::getId, Function.identity()));

        Map<Long, ItemVariation> variationMap = itemVariationRepository
                .findAllWithItemByIdIn(variationIds)
                .stream()
                .collect(Collectors.toMap(ItemVariation::getId, Function.identity()));

        Map<Long, Addon> addonMap = addonRepository.findAllById(addonIds).stream()
                .collect(Collectors.toMap(Addon::getId, Function.identity()));

        // 4. Update order fields
        Customer customer = request.getCustomerId() != null
                ? customerRepository.findById(request.getCustomerId())
                        .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND))
                : null;

        User waiter = request.getWaiterId() != null
                ? userRepository.findById(request.getWaiterId())
                        .orElseThrow(() -> new AppException(ErrorCode.WAITER_NOT_FOUND))
                : null;

        RestaurantTable newTable = request.getTableId() != null
                ? restaurantTableRepository.findById(request.getTableId())
                        .orElseThrow(() -> new AppException(ErrorCode.TABLE_NOT_FOUND))
                : null;

        if (request.getOrderType().equals(OrderType.dine_in.name()) && newTable == null) {
            throw new AppException(ErrorCode.NO_TABLE_CHOOSE_FOR_DINE_IN);
        }
        if (request.getOrderType().equals(OrderType.dine_in.name()) && waiter == null) {
            throw new AppException(ErrorCode.NO_WAITER_CHOOSE_FOR_DINE_IN);
        }

        // Handle table status changes
        RestaurantTable oldTable = order.getTable();
        if (oldTable != null && (newTable == null || !oldTable.getId().equals(newTable.getId()))) {
            oldTable.setStatus(TableStatus.available);
            restaurantTableRepository.save(oldTable);
        }
        if (newTable != null && (oldTable == null || !newTable.getId().equals(oldTable.getId()))) {
            newTable.setStatus(TableStatus.occupied);
            restaurantTableRepository.save(newTable);
        }

        BigDecimal subTotal = POS.calSubTotal(request, itemMap, variationMap, addonMap);
        BigDecimal taxAmount = POS.getTaxAmount(request, itemMap, variationMap, addonMap);
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

        order.setOrderType(OrderType.valueOf(request.getOrderType()));
        order.setCustomer(customer);
        order.setWaiter(waiter);
        order.setTable(newTable);
        order.setSubtotal(subTotal);
        order.setTaxAmount(taxAmount);
        order.setServiceCharge(serviceCharge);
        order.setDeliveryCharge(deliveryCharge);
        order.setGrandTotal(grandTotal);
        order.setNote(request.getNote());
        // Reset discount/coupon when editing
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setDiscountType(null);
        order.setCoupon(null);
        // Keep original orderedAt, status, kitchenStatus

        orderRepository.save(order);

        // 5. Re-create order items and addons
        saveOrderItem(order, itemMap, variationMap, addonMap, request);

        // 6. Return response

        OrderResponse response = OrderResponse.builder()
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

        webSocketService.sendTopic("/orders", WebSocketEvent.builder()
                .type(EventType.ORDER_UPDATED)
                .data(response)
                .build());
        return response;
    }

    private void changeTableStatus(Long tableId) {
        if (tableId == null)
            return;
        RestaurantTable table = restaurantTableRepository.findById(tableId)
                .orElseThrow(() -> new AppException(ErrorCode.TABLE_NOT_FOUND));

        table.setStatus(TableStatus.occupied);
        restaurantTableRepository.save(table);
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
