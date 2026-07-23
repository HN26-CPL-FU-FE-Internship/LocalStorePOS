package com.pos.backend.service.POS;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.enums.ItemStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;

import com.pos.backend.constant.enums.KitchenStatus;
import com.pos.backend.constant.enums.OrderPaymentStatus;
import com.pos.backend.constant.enums.OrderStatus;
import com.pos.backend.constant.enums.OrderType;
import com.pos.backend.dto.request.POS.CreateCustomerRequest;
import com.pos.backend.dto.request.POS.CreateOrderItemAddonRequest;
import com.pos.backend.dto.request.POS.CreateOrderItemRequest;
import com.pos.backend.dto.request.POS.CreateOrderRequest;
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
import com.pos.backend.entity.OrderItemAddon;
import com.pos.backend.entity.RestaurantTable;
import com.pos.backend.entity.User;
import com.pos.backend.repository.AddonRepository;
import com.pos.backend.repository.CustomerRepository;
import com.pos.backend.repository.ItemRepository;
import com.pos.backend.repository.ItemVariationRepository;
import com.pos.backend.repository.OrderItemAddonRepository;
import com.pos.backend.repository.OrderItemRepository;
import com.pos.backend.repository.OrderRepository;
import com.pos.backend.repository.RestaurantTableRepository;
import com.pos.backend.repository.UserRepository;

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
                // 1. Generate order number (time + random suffix to avoid collisions)
                String orderNumber = "#" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd-HHmmss"))
                                + String.format("%04d", ThreadLocalRandom.current().nextInt(9999)); // 2. Look up
                                                                                                    // optional
                                                                                                    // references
                Customer customer = request.getCustomerId() != null
                                ? customerRepository.findById(request.getCustomerId()).orElse(null)
                                : null;
                User waiter = request.getWaiterId() != null
                                ? userRepository.findById(request.getWaiterId()).orElse(null)
                                : null;
                RestaurantTable table = request.getTableId() != null
                                ? restaurantTableRepository.findById(request.getTableId()).orElse(null)
                                : null;

                // 3. Build & save Order
                Order order = Order.builder()
                                .orderNumber(orderNumber)
                                .orderType(OrderType.valueOf(request.getOrderType()))
                                .customer(customer)
                                .waiter(waiter)
                                .table(table)
                                .status(OrderStatus.pending)
                                .kitchenStatus(KitchenStatus.new_order)
                                .subtotal(request.getSubtotal() != null ? request.getSubtotal() : BigDecimal.ZERO)
                                .taxAmount(request.getVatAmount() != null ? request.getVatAmount() : BigDecimal.ZERO)
                                .serviceCharge(request.getServiceTaxAmount() != null ? request.getServiceTaxAmount()
                                                : BigDecimal.ZERO)
                                .grandTotal(request.getGrandTotal() != null ? request.getGrandTotal() : BigDecimal.ZERO)
                                .paymentStatus(OrderPaymentStatus.unpaid)
                                .note(request.getNote())
                                .orderedAt(LocalDateTime.now())
                                .build();
                order = orderRepository.save(order);

                // 4. Save OrderItems and OrderItemAddons
                if (request.getItems() != null) {
                        for (CreateOrderItemRequest itemReq : request.getItems()) {
                                Item item = itemRepository.findById(itemReq.getItemId()).orElse(null);
                                ItemVariation variation = itemReq.getVariationId() != null
                                                ? itemVariationRepository.findById(itemReq.getVariationId())
                                                                .orElse(null)
                                                : null;

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
                                orderItem = orderItemRepository.save(orderItem);

                                // 5. Save addons for this item
                                if (itemReq.getAddons() != null) {
                                        for (CreateOrderItemAddonRequest addonReq : itemReq.getAddons()) {
                                                Addon addon = addonRepository.findById(addonReq.getAddonId())
                                                                .orElse(null);
                                                OrderItemAddon orderItemAddon = OrderItemAddon.builder()
                                                                .orderItem(orderItem)
                                                                .addon(addon)
                                                                .addonName(addonReq.getAddonName())
                                                                .addonPrice(addonReq.getAddonPrice() != null
                                                                                ? addonReq.getAddonPrice()
                                                                                : BigDecimal.ZERO)
                                                                .quantity(1)
                                                                .build();
                                                orderItemAddonRepository.save(orderItemAddon);
                                        }
                                }
                        }
                }

                // 6. Return response (without items list for simplicity)
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

}
