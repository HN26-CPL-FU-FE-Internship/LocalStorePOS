package com.pos.backend.service.Kitchen;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.EventType;
import com.pos.backend.constant.enums.KitchenStatus;
import com.pos.backend.constant.enums.OrderItemStatus;
import com.pos.backend.constant.enums.OrderStatus;
import com.pos.backend.dto.request.Filter.OrderFilter;
import com.pos.backend.dto.request.Kitchen.StartCookingRequest;
import com.pos.backend.dto.response.Order.OrderResponse;
import com.pos.backend.dto.response.OrderItem.OrderItemResponse;
import com.pos.backend.dto.response.OrderItemAddons.OrderItemAddonResponse;
import com.pos.backend.entity.Order;
import com.pos.backend.entity.OrderItem;
import com.pos.backend.entity.OrderItemAddon;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.OrderItemAddonRepository;
import com.pos.backend.repository.OrderItemRepository;
import com.pos.backend.repository.OrderRepository;
import com.pos.backend.service.NotificationService;
import com.pos.backend.service.Order.OrderCommonService;
import com.pos.backend.service.WebSocket.WebSocketService;
import com.pos.backend.specification.OrderSpecification;
import com.pos.backend.ws.WebSocketEvent;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class KitchenService {

    OrderRepository orderRepository;
    OrderItemRepository orderItemRepository;
    OrderItemAddonRepository orderItemAddonRepository;
    OrderCommonService orderCommonService;
    WebSocketService webSocketService;
    NotificationService notificationService;

    public Map<String, Long> getKitchenStats() {

        Map<String, Long> result = new LinkedHashMap<>();
        for (KitchenStatus status : KitchenStatus.values()) {
            result.put(status.name(), 0L);
        }

        List<KitchenStatusCount> stats = orderRepository.countOrderByKitchenStatus();

        for (KitchenStatusCount statusCount : stats) {
            result.put(statusCount.getKitchenStatus(), statusCount.getTotalOrder());
        }

        return result;
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getKitchenOrders(Pageable pageable, String search, KitchenStatus kitchenStatus) {

        Page<Order> orders;
        boolean hasFilters = (search != null && !search.isBlank()) || kitchenStatus != null;
        if (hasFilters) {
            OrderFilter filter = new OrderFilter();
            if (search != null && !search.isBlank()) {
                filter.setSearch(search.trim());
            }
            filter.setKitchenStatus(kitchenStatus);
            orders = orderRepository.findAll(OrderSpecification.filter(filter), pageable);
        } else {
            orders = orderRepository.findAll(pageable);
        }
        List<Long> orderIds = orders.stream().map(order -> order.getId()).toList();

        // Do not show items that were cancelled (e.g. removed when editing the order)
        List<OrderItem> orderItems = orderItemRepository.findByOrderIdIn(orderIds).stream()
                .filter(item -> item.getStatus() != OrderItemStatus.cancelled)
                .toList();
        List<Long> orderItemIds = orderItems.stream().map(item -> item.getId()).toList();

        List<OrderItemAddon> addons = orderItemAddonRepository.findByOrderItemIdIn(orderItemIds);

        Map<Long, List<OrderItemAddonResponse>> addonsByOrderItemId = orderCommonService.groupAddonsByItemId(addons);

        Map<Long, List<OrderItemResponse>> orderItemsByOrderId = orderCommonService.groupItemsByOrderId(orderItems,
                addonsByOrderItemId);

        List<OrderResponse> orderResponses = orders.stream().map(order -> OrderResponse.builder()
                .id(order.getId())
                .kitchenStatus(order.getKitchenStatus().toString())
                .tokenNo(order.getTokenNo())
                .items(orderItemsByOrderId.getOrDefault(order.getId(), List.of()))
                .estimatedMinutes(order.getEstimatedMinutes())
                .cookingStartedAt(order.getCookingStartedAt())
                .orderNumber(order.getOrderNumber())
                .orderedAt(order.getOrderedAt())
                .orderType(order.getOrderType().toString())
                .customerName(order.getCustomer() != null ? order.getCustomer().getName()
                        : "Walk In Customer")
                .build()).toList();

        return new PageImpl<>(orderResponses, pageable, orders.getTotalElements());
    }

    @Transactional
    public OrderResponse startCooking(Long id, StartCookingRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        order.setKitchenStatus(KitchenStatus.in_kitchen);
        order.setEstimatedMinutes(request.getEstimatedMinutes());
        order.setCookingStartedAt(LocalDateTime.now());
        order.setStatus(OrderStatus.preparing);
        order = orderRepository.save(order);

        OrderResponse response = buildOrderResponse(order);
        webSocketService.sendTopic("/orders", WebSocketEvent.builder()
                .type(EventType.ORDER_UPDATED)
                .data(response)
                .build());

        notificationService.notifyOrderEvent(
                "Cooking Started",
                "Order #" + order.getOrderNumber() + " started cooking - Estimated " + request.getEstimatedMinutes() + " minutes",
                order.getId());

        return response;
    }

    @Transactional
    public OrderResponse markComplete(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        order.setKitchenStatus(KitchenStatus.completed);
        order = orderRepository.save(order);

        orderItemRepository.updateStatusByOrderId(id, OrderItemStatus.ready);
        OrderResponse response = buildOrderResponse(order);
        webSocketService.sendTopic("/orders", WebSocketEvent.builder()
                .type(EventType.ORDER_UPDATED)
                .data(response)
                .build());

        notificationService.notifyOrderEvent(
                "Order Ready",
                "Order #" + order.getOrderNumber() + " is complete - Ready to serve",
                order.getId());

        return response;
    }

    @Transactional
    public OrderResponse cancel(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        order.setKitchenStatus(KitchenStatus.cancelled);
        order.setStatus(OrderStatus.cancelled);
        order = orderRepository.save(order);

        orderItemRepository.updateStatusByOrderId(id, OrderItemStatus.cancelled);
        OrderResponse response = buildOrderResponse(order);
        webSocketService.sendTopic("/orders", WebSocketEvent.builder()
                .type(EventType.ORDER_UPDATED)
                .data(response)
                .build());
        return response;
    }

    @Transactional
    public OrderResponse markDelayed(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        order.setKitchenStatus(KitchenStatus.delayed);

        order = orderRepository.save(order);

        OrderResponse response = buildOrderResponse(order);
        webSocketService.sendTopic("/orders", WebSocketEvent.builder()
                .type(EventType.ORDER_UPDATED)
                .data(response)
                .build());

        notificationService.notifyOrderEvent(
                "Order Delayed",
                "Order #" + order.getOrderNumber() + " is delayed - Please pay attention",
                order.getId());

        return response;
    }

    private OrderResponse buildOrderResponse(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .kitchenStatus(order.getKitchenStatus().toString())
                .tokenNo(order.getTokenNo())
                .items(List.of())
                .estimatedMinutes(order.getEstimatedMinutes())
                .cookingStartedAt(order.getCookingStartedAt())
                .orderNumber(order.getOrderNumber())
                .orderedAt(order.getOrderedAt())
                .orderType(order.getOrderType().toString())
                .customerName(order.getCustomer() != null ? order.getCustomer().getName() : "Walk In Customer")
                .build();
    }
}
