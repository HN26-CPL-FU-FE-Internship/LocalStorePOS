package com.pos.backend.service.Order;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.KitchenStatus;
import com.pos.backend.constant.enums.OrderStatus;
import com.pos.backend.dto.request.Filter.DateFilter;
import com.pos.backend.dto.request.Filter.OrderFilter;
import com.pos.backend.dto.request.Order.OrderUpdateStatusRequest;
import com.pos.backend.dto.response.Order.OrderResponse;
import com.pos.backend.dto.response.OrderItem.OrderItemResponse;
import com.pos.backend.dto.response.OrderItemAddons.OrderItemAddonResponse;
import com.pos.backend.entity.Order;
import com.pos.backend.entity.OrderItem;
import com.pos.backend.entity.OrderItemAddon;
import com.pos.backend.exception.AppException;
import com.pos.backend.mapper.OrderMapper;
import com.pos.backend.repository.OrderItemAddonRepository;
import com.pos.backend.repository.OrderItemRepository;
import com.pos.backend.repository.OrderRepository;
import com.pos.backend.specification.OrderSpecification;
import com.pos.backend.util.OrderUtil;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class OrderService {

        OrderRepository orderRepository;
        OrderItemRepository orderItemRepository;
        OrderItemAddonRepository orderItemAddonRepository;
        OrderMapper orderMapper;

        public Map<String, Long> getOrderCountByStatus(DateFilter filter) {

                Long allOrderCount = 0L;
                LocalDateTime fromDate = filter.getFromDate() != null ? filter.getFromDate().atStartOfDay() : null;
                LocalDateTime toDate = filter.getToDate() != null ? filter.getToDate().plusDays(1).atStartOfDay()
                                : null;

                Map<String, Long> result = new LinkedHashMap<>();
                result.put("total", allOrderCount);

                for (OrderStatus status : OrderStatus.values()) {
                        result.put(status.name(), 0L);
                }

                List<OrderStatusCount> statusCount = orderRepository.countOrderByStatus(fromDate, toDate);
                for (OrderStatusCount c : statusCount) {
                        result.put(c.getStatus(), c.getTotalOrder());
                        allOrderCount += c.getTotalOrder();
                }

                result.put("total", allOrderCount);

                return result;
        }

        public Page<OrderResponse> getListOrders(Pageable pageable, OrderFilter filter) {

                Page<Order> orders = orderRepository.findAll(OrderSpecification.filter(filter), pageable);

                // Lấy list orderItem dựa trên list orderId
                List<Long> orderIds = orders.map(Order::getId).toList();
                List<OrderItem> orderItems = orderIds.isEmpty() ? List.of()
                                : orderItemRepository.findByOrderIdIn(orderIds);

                // lay list orderItemAddons dua tren list orderItemId
                List<Long> orderItemIds = orderItems.stream().map(OrderItem::getId).toList();
                List<OrderItemAddon> orderItemAddons = orderItemIds.isEmpty() ? List.of()
                                : orderItemAddonRepository
                                                .findByOrderItemIdIn(orderItemIds);

                // Gom nhóm addon theo order_item_id
                Map<Long, List<OrderItemAddonResponse>> addonsByItemIds = orderItemAddons.stream()
                                .collect(
                                                Collectors
                                                                .groupingBy(addon -> addon.getOrderItem().getId(),
                                                                                Collectors.mapping(
                                                                                                addon -> OrderItemAddonResponse
                                                                                                                .builder()
                                                                                                                .id(addon.getId())
                                                                                                                .addonName(addon.getAddonName())
                                                                                                                .addonPrice(addon
                                                                                                                                .getAddonPrice())
                                                                                                                .quantity(addon.getQuantity())
                                                                                                                .build(),
                                                                                                Collectors.toList())));

                // Gom nhóm order_item theo order_id
                Map<Long, List<OrderItemResponse>> orderItemsByOrderId = orderItems.stream()
                                .collect(Collectors.groupingBy(o -> o.getOrder().getId(),
                                                Collectors.mapping(o -> OrderItemResponse.builder()
                                                                .addons(addonsByItemIds.getOrDefault(o.getId(),
                                                                                List.of()))
                                                                .id(o.getId())
                                                                .itemName(o.getItemName())
                                                                .kitchenNote(o.getKitchenNote())
                                                                .quantity(o.getQuantity())
                                                                .sizeName(o.getVariation() != null
                                                                                ? o.getVariation().getSizeName()
                                                                                : null)
                                                                .build(), Collectors.toList())));

                return orders.map(order -> OrderResponse.builder()
                                .id(order.getId())
                                .tokenNo(order.getTokenNo())
                                .orderNumber(order.getOrderNumber())
                                .orderType(order.getOrderType().name())
                                .tableNumber(order.getTable() != null
                                                ? order.getTable().getTableNumber()
                                                : null)
                                .status(order.getStatus().name())
                                .subtotal(order.getSubtotal())
                                .discountAmount(order.getDiscountAmount())
                                .taxAmount(order.getTaxAmount())
                                .balanceAmount(order.getBalanceAmount())
                                .serviceCharge(order.getServiceCharge())
                                .deliveryCharge(order.getDeliveryCharge())
                                .tipAmount(order.getTipAmount())
                                .grandTotal(order.getGrandTotal())
                                .paidAmount(order.getPaidAmount())
                                .paymentStatus(order.getPaymentStatus().name())
                                .note(order.getNote())
                                .orderedAt(order.getOrderedAt())
                                .items(orderItemsByOrderId.getOrDefault(order.getId(), List.of()))
                                .build());
        }

        @Transactional
        public OrderResponse updateStatus(OrderUpdateStatusRequest request, Long id) {

                Order order = orderRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

                if (order.getStatus() == OrderStatus.delivered)
                        throw new AppException(ErrorCode.ORDER_HAS_BEEN_DELIVERED);
                if (order.getStatus() == OrderStatus.served)
                        throw new AppException(ErrorCode.ORDER_HAS_BEEN_SERVED);

                validateStatusTransition(order.getStatus(), request.getStatus());
                order.setStatus(request.getStatus());
                order.setKitchenStatus(getKitchenStatusByOrderStatus(request.getStatus()));

                return orderMapper.toOrderResponse(order);
        }

        private KitchenStatus getKitchenStatusByOrderStatus(OrderStatus status) {
                return switch (status) {
                        case pending -> KitchenStatus.new_order;
                        case preparing -> KitchenStatus.in_kitchen;
                        case served, delivered, completed -> KitchenStatus.completed;
                        case cancelled -> KitchenStatus.cancelled;
                };
        }

        private void validateStatusTransition(OrderStatus current, OrderStatus next) {
                if (current == next) {
                        return;
                }

                if (!OrderUtil.ALLOWED_TRANSITIONS.getOrDefault(current, Set.of()).contains(next)) {
                        throw new AppException(ErrorCode.INVALID_ORDER_STATUS_TRANSITION);
                }
        }
}
