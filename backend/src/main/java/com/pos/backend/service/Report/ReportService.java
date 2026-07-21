package com.pos.backend.service.Report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.pos.backend.dto.response.Report.CustomerReportResponse;
import com.pos.backend.dto.response.Report.EarningReportResponse;
import com.pos.backend.dto.response.Report.OrderReportResponse;
import com.pos.backend.dto.response.Report.SalesReportResponse;
import com.pos.backend.entity.Category;
import com.pos.backend.entity.Customer;
import com.pos.backend.entity.Order;
import com.pos.backend.entity.OrderItem;
import com.pos.backend.repository.CategoryRepository;
import com.pos.backend.repository.CustomerRepository;
import com.pos.backend.repository.OrderItemRepository;
import com.pos.backend.repository.OrderRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReportService {

    OrderRepository orderRepository;
    OrderItemRepository orderItemRepository;
    CustomerRepository customerRepository;
    CategoryRepository categoryRepository;

    /**
     * Earning Report: list all completed/paid orders as earning entries.
     */
    public List<EarningReportResponse> getEarningReport(LocalDate fromDate, LocalDate toDate,
            String customerName, String paymentMethod) {

        LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : LocalDateTime.of(2020, 1, 1, 0, 0);
        LocalDateTime to = toDate != null ? toDate.plusDays(1).atStartOfDay() : LocalDateTime.now().plusDays(1);

        List<Order> orders = orderRepository.findCompletedOrdersInRange(from, to);

        return orders.stream()                .filter(o -> {
                    if (customerName == null || customerName.isBlank()) return true;
                    String lowerCustomer = customerName.toLowerCase();
                    if (o.getCustomer() != null && o.getCustomer().getName() != null
                            && o.getCustomer().getName().toLowerCase().contains(lowerCustomer)) {
                        return true;
                    }
                    // Match walk-in customer only when searching for relevant keywords
                    return o.getCustomer() == null && (lowerCustomer.contains("walk") || lowerCustomer.contains("walk-in"));
                })
                .filter(o -> {
                    if (paymentMethod == null || paymentMethod.isBlank()) return true;
                    return o.getPaymentType() != null
                            && o.getPaymentType().equalsIgnoreCase(paymentMethod);
                })
                .map(order -> {
                    String customer = order.getCustomer() != null ? order.getCustomer().getName() : "Walk-in Customer";
                    String paymentType = order.getPaymentType() != null ? order.getPaymentType() : "N/A";
                    String status = order.getPaymentStatus() != null ? order.getPaymentStatus().name() : "paid";

                    return EarningReportResponse.builder()
                            .earningId("ERN" + String.format("%04d", order.getId()))
                            .date(order.getOrderedAt())
                            .orderNumber(order.getOrderNumber())
                            .customerName(customer)
                            .orderType(order.getOrderType() != null ? order.getOrderType().name().replace("_", " ") : "N/A")
                            .paymentMethod(paymentType)
                            .grandTotal(order.getGrandTotal())
                            .status(status)
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * Order Report: list all orders with item count.
     */
    public List<OrderReportResponse> getOrderReport(LocalDate fromDate, LocalDate toDate,
            String customerName) {

        LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : LocalDateTime.of(2020, 1, 1, 0, 0);
        LocalDateTime to = toDate != null ? toDate.plusDays(1).atStartOfDay() : LocalDateTime.now().plusDays(1);

        List<Order> orders = orderRepository.findOrdersInRange(from, to);

        // Get item counts per order
        List<Long> orderIds = orders.stream().map(Order::getId).collect(Collectors.toList());
        Map<Long, Long> itemCountByOrder = orderIds.isEmpty() ? Map.of()
                : orderItemRepository.countItemsByOrderIds(orderIds).stream()
                        .collect(Collectors.toMap(
                                arr -> (Long) arr[0],
                                arr -> (Long) arr[1]));

        return orders.stream()
                .filter(o -> {
                    if (customerName == null || customerName.isBlank()) return true;
                    String lowerCustomer = customerName.toLowerCase();
                    if (o.getCustomer() != null && o.getCustomer().getName() != null
                            && o.getCustomer().getName().toLowerCase().contains(lowerCustomer)) {
                        return true;
                    }
                    return o.getCustomer() == null && (lowerCustomer.contains("walk") || lowerCustomer.contains("walk-in"));
                })
                .map(order -> {
                    String customer = order.getCustomer() != null ? order.getCustomer().getName()
                            : "Walk-in Customer";
                    Long menus = itemCountByOrder.getOrDefault(order.getId(), 0L);
                    String status = order.getStatus() != null ? order.getStatus().name() : "pending";

                    return OrderReportResponse.builder()
                            .orderNumber(order.getOrderNumber())
                            .date(order.getOrderedAt())
                            .customerName(customer)
                            .tokenNo(order.getTokenNo() != null ? order.getTokenNo() : "")
                            .orderType(order.getOrderType() != null ? order.getOrderType().name().replace("_", " ") : "N/A")
                            .menus(menus)
                            .grandTotal(order.getGrandTotal())
                            .status(status)
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * Sales Report: aggregate sales by category.
     */
    public List<SalesReportResponse> getSalesReport(LocalDate fromDate, LocalDate toDate,
            String categoryName) {

        LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : LocalDateTime.of(2020, 1, 1, 0, 0);
        LocalDateTime to = toDate != null ? toDate.plusDays(1).atStartOfDay() : LocalDateTime.now().plusDays(1);

        List<Order> orders = orderRepository.findCompletedOrdersInRange(from, to);
        List<Long> orderIds = orders.stream().map(Order::getId).collect(Collectors.toList());

        if (orderIds.isEmpty()) {
            return List.of();
        }

        // Get all order items with their category info
        List<Object[]> categorySales = orderItemRepository.findCategorySalesByOrderIds(orderIds);

        // Map: categoryId -> { totalOrders, itemsSold, grandTotal }
        Map<Long, List<Object[]>> groupedByCategory = categorySales.stream()
                .collect(Collectors.groupingBy(arr -> (Long) arr[0]));

        List<SalesReportResponse> result = new ArrayList<>();

        for (Map.Entry<Long, List<Object[]>> entry : groupedByCategory.entrySet()) {
            Long categoryId = entry.getKey();
            List<Object[]> rows = entry.getValue();

            // Get category name
            String catName = categoryRepository.findById(categoryId)
                    .map(Category::getName)
                    .orElse("Unknown");

            // Filter by category name if specified
            if (categoryName != null && !categoryName.isBlank()
                    && !catName.toLowerCase().contains(categoryName.toLowerCase())) {
                continue;
            }

            long itemsSold = rows.stream().mapToLong(arr -> ((Number) arr[2]).longValue()).sum();
            long totalOrders = rows.stream().map(arr -> (Long) arr[3]).distinct().count();
            BigDecimal grandTotal = rows.stream()
                    .map(arr -> (BigDecimal) arr[4])
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            result.add(SalesReportResponse.builder()
                    .salesId("SA" + String.format("%04d", categoryId))
                    .date(orders.stream().findFirst().map(Order::getOrderedAt).orElse(null))
                    .categoryName(catName)
                    .itemsSold(itemsSold)
                    .totalOrders(totalOrders)
                    .grandTotal(grandTotal)
                    .status("completed")
                    .build());
        }

        return result;
    }

    /**
     * Customer Report: aggregate order data per customer.
     */
    public List<CustomerReportResponse> getCustomerReport(LocalDate fromDate, LocalDate toDate,
            String customerName) {

        LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : LocalDateTime.of(2020, 1, 1, 0, 0);
        LocalDateTime to = toDate != null ? toDate.plusDays(1).atStartOfDay() : LocalDateTime.now().plusDays(1);

        List<Object[]> customerSales = orderRepository.findCustomerSalesInRange(from, to);

        return customerSales.stream()
                .map(arr -> {
                    Long customerId = (Long) arr[0];
                    String name = (String) arr[1];
                    String avatar = (String) arr[2];
                    Long totalOrders = (Long) arr[3];
                    BigDecimal grandTotal = (BigDecimal) arr[4];

                    // Filter by customer name if specified
                    if (customerName != null && !customerName.isBlank()
                            && !name.toLowerCase().contains(customerName.toLowerCase())) {
                        return null;
                    }

                    return CustomerReportResponse.builder()
                            .customerId("CUS" + String.format("%04d", customerId))
                            .customerName(name)
                            .avatarPath(avatar)
                            .totalOrders(totalOrders)
                            .grandTotal(grandTotal)
                            .build();
                })
                .filter(r -> r != null)
                .collect(Collectors.toList());
    }
}
