package com.pos.backend.service.Order;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.AuditAction;
import com.pos.backend.constant.enums.CouponStatus;
import com.pos.backend.constant.enums.DiscountType;
import com.pos.backend.constant.enums.EventType;
import com.pos.backend.constant.enums.KitchenStatus;
import com.pos.backend.constant.enums.OrderItemStatus;
import com.pos.backend.constant.enums.OrderPaymentStatus;
import com.pos.backend.constant.enums.OrderStatus;
import com.pos.backend.constant.enums.PaymentStatus;
import com.pos.backend.constant.enums.TableStatus;
import com.pos.backend.dto.request.Filter.DateFilter;
import com.pos.backend.dto.request.Filter.OrderFilter;
import com.pos.backend.dto.request.Order.OrderPaymentRequest;
import com.pos.backend.dto.request.Order.OrderUpdateStatusRequest;
import com.pos.backend.dto.response.Order.OrderResponse;
import com.pos.backend.dto.response.OrderItem.OrderItemResponse;
import com.pos.backend.dto.response.OrderItemAddons.OrderItemAddonResponse;
import com.pos.backend.entity.Coupon;
import com.pos.backend.entity.Customer;
import com.pos.backend.entity.Order;
import com.pos.backend.entity.OrderItem;
import com.pos.backend.entity.OrderItemAddon;
import com.pos.backend.entity.Payment;
import com.pos.backend.entity.PaymentMethod;
import com.pos.backend.entity.RestaurantTable;
import com.pos.backend.entity.User;
import com.pos.backend.exception.AppException;
import com.pos.backend.mapper.CouponMapper;
import com.pos.backend.mapper.OrderMapper;
import com.pos.backend.repository.CouponRepository;
import com.pos.backend.service.Audit.AuditLogService;
import com.pos.backend.repository.OrderItemAddonRepository;
import com.pos.backend.repository.OrderItemRepository;
import com.pos.backend.repository.OrderRepository;
import com.pos.backend.repository.PaymentMethodRepository;
import com.pos.backend.repository.PaymentRepository;
import com.pos.backend.repository.RestaurantTableRepository;
import com.pos.backend.service.NotificationService;
import com.pos.backend.service.WebSocket.WebSocketService;
import com.pos.backend.specification.OrderSpecification;
import com.pos.backend.util.LocalDateTimeUtil;
import com.pos.backend.util.OrderUtil;
import com.pos.backend.ws.WebSocketEvent;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class OrderService {

    OrderRepository orderRepository;
    OrderItemRepository orderItemRepository;
    OrderItemAddonRepository orderItemAddonRepository;
    PaymentRepository paymentRepository;
    PaymentMethodRepository paymentMethodRepository;
    CouponRepository couponRepository;
    RestaurantTableRepository restaurantTableRepository;
    OrderMapper orderMapper;
    CouponMapper couponMapper;
    OrderCommonService orderCommonService;
    WebSocketService webSocketService;
    AuditLogService auditLogService;
    NotificationService notificationService;

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

        Map<Long, List<OrderItemResponse>> orderItemsByOrderId = loadOrderItemsGroupedByOrderId(
                orders.map(Order::getId).toList());

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
                .discountType(order.getDiscountType() != null
                        ? order.getDiscountType().name()
                        : null)
                .taxAmount(order.getTaxAmount())
                .balanceAmount(order.getBalanceAmount())
                .serviceCharge(order.getServiceCharge())
                .deliveryCharge(order.getDeliveryCharge())
                .tipAmount(order.getTipAmount())
                .grandTotal(order.getGrandTotal())
                .paidAmount(order.getPaidAmount())
                .paymentStatus(order.getPaymentStatus().name())
                .paymentType(order.getPaymentType())
                .note(order.getNote())
                .orderedAt(order.getOrderedAt())
                .items(orderItemsByOrderId.getOrDefault(order.getId(), List.of()))
                .coupon(couponMapper.toCouponResponse(order.getCoupon()))
                .build());
    }

    @Transactional
    public OrderResponse updateStatus(OrderUpdateStatusRequest request, Long id) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        validateStatusTransition(order.getStatus(), request.getStatus());
        order.setStatus(request.getStatus());
        order.setKitchenStatus(getKitchenStatusByOrderStatus(request.getStatus()));

        switch (request.getStatus()) {
            case cancelled -> {
                if (order.getTable() != null) {
                    RestaurantTable table = restaurantTableRepository.findById(order.getTable().getId())
                            .orElseThrow(() -> new AppException(ErrorCode.TABLE_NOT_FOUND));

                    table.setStatus(TableStatus.available);
                }
            }

            case delivered, served -> {
                orderItemRepository.updateStatusByOrderId(id, OrderItemStatus.served);
            }

            default -> {
            }
        }
        OrderResponse orderResponse = orderMapper.toOrderResponse(order);
        webSocketService.sendTopic("/orders", WebSocketEvent.builder()
                .type(EventType.ORDER_UPDATED)
                .data(orderResponse)
                .build());
        auditLogService.log(null, AuditAction.ORDER_STATUS_CHANGED, "ORDER", "Order", id,
                "Order #" + order.getOrderNumber() + " status changed to " + request.getStatus(),
                null, null, "SUCCESS", null);

        notificationService.notifyOrderEvent(
                "Order Status Changed",
                "Order #" + order.getOrderNumber() + " status changed to " + request.getStatus(),
                order.getId());

        return orderResponse;
    }

    private KitchenStatus getKitchenStatusByOrderStatus(OrderStatus status) {
        return switch (status) {
            case pending -> KitchenStatus.new_order;
            case preparing -> KitchenStatus.in_kitchen;
            case served, delivered, completed -> KitchenStatus.completed;
            case cancelled -> KitchenStatus.cancelled;
        };
    }

    @Transactional
    public OrderResponse processPayment(OrderPaymentRequest request, Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if (order.getStatus() == OrderStatus.completed || order.getStatus() == OrderStatus.cancelled) {
            throw new AppException(ErrorCode.ORDER_ALREADY_COMPLETED_OR_CANCELLED);
        }

        applyPaymentModifiers(order, request);
        order.setGrandTotal(recalculateGrandTotal(order));
        applyGivenAmount(order, request);

        if (request.getPaymentType() != null && !request.getPaymentType().isBlank()) {
            order.setPaymentType(request.getPaymentType());
        }

        // Mark order as completed and paid
        order.setStatus(OrderStatus.completed);
        order.setPaymentStatus(OrderPaymentStatus.paid);
        order.setKitchenStatus(KitchenStatus.completed);
        orderRepository.save(order);

        Payment payment = createPaymentRecord(order, request);

        OrderResponse orderResponse = orderMapper.toOrderResponse(order);

        auditLogService.log(null, AuditAction.PAYMENT_PROCESSED, "PAYMENT", "Order", id,
                "Payment processed for order #" + order.getOrderNumber() + ": $" + order.getGrandTotal()
                        + " via " + request.getPaymentType(),
                null, null, "SUCCESS", null);
        webSocketService.sendTopic("/orders", WebSocketEvent.builder()
                .type(EventType.ORDER_UPDATED)
                .data(orderResponse)
                .build());

        notificationService.notifyPaymentEvent(
                "Payment Successful",
                "Order #" + order.getOrderNumber() + " paid $" + order.getGrandTotal()
                        + " via " + request.getPaymentType(),
                payment.getId());

        return orderResponse;
    }

    /**
     * Apply discount / tip / note / table-release / coupon modifiers and log the
     * corresponding audit events.
     */
    private void applyPaymentModifiers(Order order, OrderPaymentRequest request) {
        if (request.getDiscountAmount() != null) {
            order.setDiscountAmount(request.getDiscountAmount());
        }

        // Update discount type (only when a discount was actually applied)
        if (request.getDiscountType() != null && !request.getDiscountType().isBlank()
                && request.getDiscountAmount() != null
                && request.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            order.setDiscountType(
                    DiscountType.valueOf(request.getDiscountType()));
        } else if (request.getDiscountAmount() == null
                || request.getDiscountAmount().compareTo(BigDecimal.ZERO) <= 0) {
            // No discount applied — clear any previously stored discount type
            order.setDiscountType(null);
        }

        if (request.getTipAmount() != null) {
            order.setTipAmount(request.getTipAmount());
        }

        if (request.getNote() != null && !request.getNote().isBlank()) {
            order.setNote(request.getNote());
        } else if (request.getNote() != null) {
            // Explicitly clear note if an empty string is sent
            order.setNote(null);
        }

        releaseTableOnPayment(order);
        applyCoupon(order, request);

        // Audit log for discount/coupon applied
        if (request.getDiscountAmount() != null && request.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            auditLogService.log(null, AuditAction.DISCOUNT_APPLIED, "DISCOUNT", "Order", order.getId(),
                    "Discount applied to order #" + order.getOrderNumber() + ": $" + request.getDiscountAmount(),
                    null, null, "SUCCESS", null);
        }
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            auditLogService.log(null, AuditAction.COUPON_APPLIED, "DISCOUNT", "Order", order.getId(),
                    "Coupon applied to order #" + order.getOrderNumber() + ": " + request.getCouponCode(),
                    null, null, "SUCCESS", null);
        }
    }

    private void releaseTableOnPayment(Order order) {
        if (order.getTable() != null) {
            RestaurantTable table = restaurantTableRepository
                    .findByTableNumber(order.getTable().getTableNumber())
                    .orElseThrow(() -> new AppException(ErrorCode.TABLE_NOT_FOUND));

            table.setStatus(TableStatus.available);
            order.setTable(table);
        }
    }

    private void applyCoupon(Order order, OrderPaymentRequest request) {
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            List<Coupon> activeCoupons = couponRepository.findByStatus(CouponStatus.active);
            Coupon found = activeCoupons.stream()
                    .filter(c -> c.getCode().equalsIgnoreCase(request.getCouponCode()))
                    .findFirst()
                    .orElse(null);
            order.setCoupon(found);
        }
    }

    /**
     * Recalculate the grand total after discounts/coupons/tips are applied.
     * Rejects the payment if the total falls to zero or below.
     */
    private BigDecimal recalculateGrandTotal(Order order) {
        BigDecimal subtotal = order.getSubtotal();
        BigDecimal discVal = calculateDiscountValue(
                subtotal, order.getDiscountAmount(), order.getDiscountType());
        BigDecimal coupVal = order.getCoupon() != null
                ? calculateDiscountValue(subtotal,
                        order.getCoupon().getDiscountAmount(),
                        order.getCoupon().getDiscountType())
                : BigDecimal.ZERO;
        BigDecimal grandTotal = subtotal
                .subtract(discVal)
                .subtract(coupVal)
                .add(order.getTaxAmount())
                .add(order.getServiceCharge())
                .add(order.getDeliveryCharge())
                .add(order.getTipAmount())
                .max(BigDecimal.ZERO) // Never go negative
                .setScale(2, RoundingMode.HALF_UP); // Match frontend 2-decimal rounding

        // Reject payment if the total is zero (100% discount + coupon wiped out
        // everything)
        if (grandTotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.ZERO_TOTAL);
        }
        return grandTotal;
    }

    /**
     * Set paid/balance amounts based on the payment type. Cash must cover the
     * grand total; card/scan payments use the exact total.
     */
    private void applyGivenAmount(Order order, OrderPaymentRequest request) {
        if ("cash".equalsIgnoreCase(request.getPaymentType())) {
            if (request.getGivenAmount() == null
                    || request.getGivenAmount().compareTo(BigDecimal.ZERO) <= 0
                    || request.getGivenAmount().compareTo(order.getGrandTotal()) < 0) {
                throw new AppException(ErrorCode.INSUFFICIENT_PAYMENT);
            }
            order.setPaidAmount(request.getGivenAmount());
            order.setBalanceAmount(request.getGivenAmount().subtract(order.getGrandTotal()));
        } else {
            order.setPaidAmount(order.getGrandTotal());
            order.setBalanceAmount(BigDecimal.ZERO);
        }
    }

    private Payment createPaymentRecord(Order order, OrderPaymentRequest request) {
        String transactionId = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        PaymentMethod paymentMethod = null;
        if (request.getPaymentType() != null) {
            List<PaymentMethod> methods = paymentMethodRepository.findAll();
            paymentMethod = methods.stream()
                    .filter(m -> m.getCode().equalsIgnoreCase(request.getPaymentType()))
                    .findFirst()
                    .orElse(null);
        }

        Payment payment = Payment.builder()
                .transactionId(transactionId)
                .order(order)
                .paymentMethod(paymentMethod)
                .amount(order.getGrandTotal())
                .status(PaymentStatus.success)
                .paidAt(LocalDateTimeUtil.getTimeNow())
                .build();

        return paymentRepository.save(payment);
    }

    @Transactional
    public OrderResponse reopenInvoice(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        order.setStatus(OrderStatus.pending);
        order.setPaymentStatus(OrderPaymentStatus.unpaid);
        order.setKitchenStatus(KitchenStatus.new_order);
        order.setPaidAmount(BigDecimal.ZERO);
        order.setBalanceAmount(BigDecimal.ZERO);
        orderRepository.save(order);

        OrderResponse response = orderMapper.toOrderResponse(order);
        webSocketService.sendTopic("/orders", WebSocketEvent.builder()
                .type(EventType.ORDER_UPDATED)
                .data(response)
                .build());
        auditLogService.log(null, AuditAction.ORDER_UPDATED, "ORDER", "Order", id,
                "Order #" + order.getOrderNumber() + " reopened (paid invoice)",
                null, null, "SUCCESS", null);
        return response;
    }

    public OrderResponse getOrderDetail(String orderNumber) {

        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        OrderResponse response = orderMapper.toOrderResponse(order);

        populateDetailFields(response, order);
        response.setItems(loadOrderItemsGroupedByOrderId(List.of(order.getId())).get(order.getId()));
        return response;
    }

    /**
     * Resolve the order's customer / table / waiter references onto the response
     * (these are not populated by the mapper).
     */
    private void populateDetailFields(OrderResponse response, Order order) {
        Customer customer = order.getCustomer();
        RestaurantTable table = order.getTable();
        User waiter = order.getWaiter();

        response.setCustomerName(customer != null ? customer.getName() : null);
        response.setCustomerId(customer != null ? customer.getId() : null);
        response.setTableNumber(table != null ? table.getTableNumber() : null);
        response.setTableId(table != null ? table.getId() : null);
        response.setWaiter(waiter != null
                ? waiter.getFirstName() + " " + waiter.getLastName()
                : null);
        response.setWaiterId(waiter != null ? waiter.getId() : null);
    }

    /**
     * Batch-load order items + their addons for the given order ids and group
     * them as {@code orderId -> items}. Used by both list and detail queries.
     */
    private Map<Long, List<OrderItemResponse>> loadOrderItemsGroupedByOrderId(List<Long> orderIds) {
        if (orderIds.isEmpty()) {
            return Map.of();
        }

        List<OrderItem> orderItems = orderItemRepository.findByOrderIdIn(orderIds);
        List<Long> orderItemIds = orderItems.stream().map(OrderItem::getId).toList();

        List<OrderItemAddon> orderItemAddons = orderItemIds.isEmpty() ? List.of()
                : orderItemAddonRepository.findByOrderItemIdIn(orderItemIds);

        Map<Long, List<OrderItemAddonResponse>> addonsByItemIds = orderCommonService
                .groupAddonsByItemId(orderItemAddons);

        return orderCommonService.groupItemsByOrderId(orderItems, addonsByItemIds);
    }

    /**
     * Calculate the monetary value of a discount/tax based on discount type.
     * Matches the frontend's {@code calculateDiscount} logic:
     * - 'percentage': round((subtotal / 100) * min(100, discount))
     * - 'fixed_amount': round(min(discount, subtotal))
     */
    private BigDecimal calculateDiscountValue(BigDecimal subtotal, BigDecimal amount, DiscountType type) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0)
            return BigDecimal.ZERO;

        switch (type) {
            case percentage: {
                BigDecimal capped = amount.min(BigDecimal.valueOf(100));
                return subtotal.multiply(capped)
                        .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
            }
            case fixed_amount: {
                return amount.min(subtotal).setScale(0, RoundingMode.HALF_UP);
            }
            default:
                return BigDecimal.ZERO;
        }
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
