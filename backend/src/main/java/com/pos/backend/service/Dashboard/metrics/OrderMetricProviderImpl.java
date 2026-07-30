package com.pos.backend.service.Dashboard.metrics;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.pos.backend.constant.enums.OrderStatus;
import com.pos.backend.dto.response.Dashboard.ActiveOrderResponse;
import com.pos.backend.dto.response.Dashboard.DashboardStatsResponse;
import com.pos.backend.entity.Customer;
import com.pos.backend.entity.Order;
import com.pos.backend.repository.OrderRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderMetricProviderImpl implements OrderMetricProvider {

    OrderRepository orderRepository;

    @Override
    public void fillOrderStats(DashboardStatsResponse stats, LocalDateTime fromDate, LocalDateTime toDate) {
        long totalOrders = orderRepository.countOrdersBetween(fromDate, toDate);
        stats.setTotalOrders(totalOrders);
    }

    @Override
    public List<ActiveOrderResponse> getActiveOrders(int limit) {
        List<Order> orders = orderRepository.findActiveOrders(PageRequest.of(0, limit),
                List.of(OrderStatus.completed, OrderStatus.cancelled));
        return orders.stream()
                .map(this::toActiveOrderResponse)
                .toList();
    }

    private ActiveOrderResponse toActiveOrderResponse(Order order) {
        Customer customer = order.getCustomer();
        String customerName = Optional.ofNullable(customer)
                .map(Customer::getName)
                .orElse("Walk in Customer");
        String avatarUrl = Optional.ofNullable(customer)
                .map(Customer::getAvatarPath)
                .orElse(null);

        return ActiveOrderResponse.builder()
                .id(order.getId())
                .customerName(customerName)
                .avatarUrl(avatarUrl)
                .type(order.getOrderType() != null ? order.getOrderType().name() : null)
                .tableNo(order.getTable() != null ? order.getTable().getTableNumber() : null)
                .status(order.getStatus() != null ? order.getStatus().name() : null)
                .statusVariant(mapStatusVariant(order.getStatus()))
                .build();
    }

    private String mapStatusVariant(com.pos.backend.constant.enums.OrderStatus status) {
        if (status == null) {
            return "secondary";
        }
        return switch (status) {
            case pending -> "warning";
            case preparing -> "purple";
            case served, delivered -> "orange";
            case completed -> "success";
            case cancelled -> "danger";
        };
    }
}
