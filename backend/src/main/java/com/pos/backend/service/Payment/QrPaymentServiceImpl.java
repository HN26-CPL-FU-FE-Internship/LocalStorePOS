package com.pos.backend.service.Payment;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.DiscountType;
import com.pos.backend.constant.enums.EventType;
import com.pos.backend.constant.enums.KitchenStatus;
import com.pos.backend.constant.enums.OrderPaymentStatus;
import com.pos.backend.constant.enums.OrderStatus;
import com.pos.backend.constant.enums.PaymentStatus;
import com.pos.backend.dto.request.Payment.QrPaymentConfirmRequest;
import com.pos.backend.constant.enums.TableStatus;
import com.pos.backend.dto.request.Payment.QrPaymentCreateRequest;
import com.pos.backend.dto.response.Order.OrderResponse;
import com.pos.backend.dto.response.Payment.QrPaymentConfirmResponse;
import com.pos.backend.dto.response.Payment.QrPaymentInfoResponse;
import com.pos.backend.dto.response.Payment.QrPaymentResponse;
import com.pos.backend.entity.Coupon;
import com.pos.backend.entity.Order;
import com.pos.backend.entity.Payment;
import com.pos.backend.entity.PaymentMethod;
import com.pos.backend.entity.RestaurantTable;
import com.pos.backend.exception.AppException;
import com.pos.backend.mapper.OrderMapper;
import com.pos.backend.repository.CouponRepository;
import com.pos.backend.repository.OrderRepository;
import com.pos.backend.repository.PaymentMethodRepository;
import com.pos.backend.repository.PaymentRepository;
import com.pos.backend.repository.RestaurantTableRepository;
import com.pos.backend.service.NotificationService;
import com.pos.backend.service.WebSocket.WebSocketService;
import com.pos.backend.ws.WebSocketEvent;
import com.pos.backend.ws.WebSocketPaymentEvent;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class QrPaymentServiceImpl implements QrPaymentService {

    private static final long QR_PAYMENT_EXPIRATION_MINUTES = 15;

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final CouponRepository couponRepository;
    private final RestaurantTableRepository restaurantTableRepository;
    private final OrderMapper orderMapper;
    private final WebSocketService webSocketService;
    private final NotificationService notificationService;

    @Value("${app.cors.allowed-origins}")
    private String qrPaymentBaseUrl;

    @Override
    @Transactional
    public QrPaymentResponse createQrPayment(Long orderId, QrPaymentCreateRequest request) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if (order.getStatus() == OrderStatus.completed || order.getStatus() == OrderStatus.cancelled) {
            throw new AppException(ErrorCode.ORDER_ALREADY_COMPLETED_OR_CANCELLED);
        }

        if (order.getPaymentStatus() == OrderPaymentStatus.paid) {
            throw new AppException(ErrorCode.ORDER_NOT_ELIGIBLE_FOR_QR);
        }

        applyAdjustments(order, request);

        BigDecimal finalAmount = calculateFinalAmount(order);
        if (finalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.ZERO_TOTAL);
        }

        PaymentMethod qrMethod = paymentMethodRepository.findByCode("qr")
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

        // A new QR replaces every still-pending QR for this order.
        paymentRepository.invalidatePendingQrPayments(orderId);

        String paymentCode = generatePaymentCode();
        String transactionId = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        LocalDateTime expiresAt = LocalDateTimeUtil.getTimeNow().plusMinutes(QR_PAYMENT_EXPIRATION_MINUTES);

        Payment payment = Payment.builder()
                .transactionId(transactionId)
                .paymentCode(paymentCode)
                .order(order)
                .paymentMethod(qrMethod)
                .amount(finalAmount)
                .status(PaymentStatus.pending)
                .paidAt(null)
                .expiresAt(expiresAt)
                .build();

        order.setGrandTotal(finalAmount);

        paymentRepository.save(payment);
        orderRepository.save(order);

        return QrPaymentResponse.builder()
                .paymentCode(paymentCode)
                .amount(finalAmount)
                .qrContent(qrPaymentBaseUrl + "/payment/" + paymentCode)
                .expiresAt(toOffsetDateTime(expiresAt))
                .build();
    }

    @Override
    @Transactional
    public QrPaymentInfoResponse getPaymentInfo(String paymentCode) {
        Payment payment = paymentRepository.findByPaymentCodeForUpdate(paymentCode)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        expireIfNeeded(payment);
        return toInfoResponse(payment);
    }

    @Override
    @Transactional
    public QrPaymentConfirmResponse confirmQrPayment(String paymentCode, QrPaymentConfirmRequest request) {
        Payment payment = paymentRepository.findByPaymentCodeForUpdate(paymentCode)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        if (expireIfNeeded(payment)) {
            return QrPaymentConfirmResponse.builder()
                    .status("EXPIRED")
                    .message(ErrorCode.PAYMENT_EXPIRED.getMessage())
                    .paymentCode(payment.getPaymentCode())
                    .amount(payment.getAmount())
                    .build();
        }

        if (payment.getStatus() != PaymentStatus.pending) {
            throw new AppException(ErrorCode.PAYMENT_ALREADY_PROCESSED);
        }

        if (payment.getAmount().compareTo(request.getAmount()) != 0) {
            return QrPaymentConfirmResponse.builder()
                    .status("FAILED")
                    .message("Invalid payment amount")
                    .build();
        }

        Order order = payment.getOrder();
        order.setStatus(OrderStatus.completed);
        order.setPaymentStatus(OrderPaymentStatus.paid);
        order.setKitchenStatus(KitchenStatus.completed);
        order.setPaymentType("qr");
        order.setPaidAmount(payment.getAmount());
        order.setBalanceAmount(BigDecimal.ZERO);

        if (order.getTable() != null) {
            RestaurantTable table = restaurantTableRepository
                    .findByTableNumber(order.getTable().getTableNumber())
                    .orElseThrow(() -> new AppException(ErrorCode.TABLE_NOT_FOUND));
            table.setStatus(TableStatus.available);
        }

        payment.setStatus(PaymentStatus.success);
        payment.setPaidAt(LocalDateTimeUtil.getTimeNow());

        orderRepository.save(order);
        paymentRepository.save(payment);

        webSocketService.sendTopic("/orders/" + order.getId() + "/payment", WebSocketEvent.builder()
                .type(EventType.PAYMENT_COMPLETED)
                .data(WebSocketPaymentEvent.builder()
                        .orderId(order.getId())
                        .paymentStatus("PAID")
                        .paymentId(payment.getPaymentCode())
                        .build())
                .build());

        OrderResponse orderResponse = orderMapper.toOrderResponse(order);
        webSocketService.sendTopic("/orders", WebSocketEvent.builder()
                .type(EventType.ORDER_UPDATED)
                .data(orderResponse)
                .build());

        notificationService.notifyPaymentEvent(
                "QR Payment Successful",
                "Order #" + order.getOrderNumber() + " paid $" + payment.getAmount() + " via QR",
                payment.getId());

        return QrPaymentConfirmResponse.builder()
                .status("SUCCESS")
                .paymentCode(payment.getPaymentCode())
                .amount(payment.getAmount())
                .orderNumber(order.getOrderNumber())
                .merchantName("Restaurant POS")
                .build();
    }

    @Override
    @Transactional
    public QrPaymentInfoResponse cancelQrPayment(String paymentCode) {
        Payment payment = paymentRepository.findByPaymentCodeForUpdate(paymentCode)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        expireIfNeeded(payment);

        if (payment.getStatus() != PaymentStatus.pending) {
            return toInfoResponse(payment);
        }

        payment.setStatus(PaymentStatus.failed);
        paymentRepository.save(payment);

        return toInfoResponse(payment);
    }

    private void applyAdjustments(Order order, QrPaymentCreateRequest request) {
        if (request.getDiscountAmount() != null) {
            order.setDiscountAmount(request.getDiscountAmount());
        }

        if (request.getDiscountType() != null && !request.getDiscountType().isBlank()
                && request.getDiscountAmount() != null
                && request.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            order.setDiscountType(DiscountType.valueOf(request.getDiscountType()));
        } else if (request.getDiscountAmount() == null
                || request.getDiscountAmount().compareTo(BigDecimal.ZERO) <= 0) {
            order.setDiscountType(null);
        }

        if (request.getTipAmount() != null) {
            order.setTipAmount(request.getTipAmount());
        }

        if (request.getNote() != null && !request.getNote().isBlank()) {
            order.setNote(request.getNote());
        }

        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            List<Coupon> activeCoupons = couponRepository
                    .findByStatus(com.pos.backend.constant.enums.CouponStatus.active);
            Coupon found = activeCoupons.stream()
                    .filter(c -> c.getCode().equalsIgnoreCase(request.getCouponCode()))
                    .findFirst()
                    .orElse(null);
            order.setCoupon(found);
        } else {
            order.setCoupon(null);
        }
    }

    private BigDecimal calculateFinalAmount(Order order) {
        BigDecimal subtotal = order.getSubtotal();
        BigDecimal discVal = calculateDiscountValue(subtotal, order.getDiscountAmount(), order.getDiscountType());
        BigDecimal coupVal = order.getCoupon() != null
                ? calculateDiscountValue(subtotal, order.getCoupon().getDiscountAmount(),
                        order.getCoupon().getDiscountType())
                : BigDecimal.ZERO;

        return subtotal
                .subtract(discVal)
                .subtract(coupVal)
                .add(order.getTaxAmount())
                .add(order.getServiceCharge())
                .add(order.getDeliveryCharge())
                .add(order.getTipAmount())
                .max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);
    }

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

    private String generatePaymentCode() {
        String date = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "PAY-" + date + "-" + suffix;
    }

    private QrPaymentInfoResponse toInfoResponse(Payment payment) {
        return QrPaymentInfoResponse.builder()
                .paymentCode(payment.getPaymentCode())
                .amount(payment.getAmount())
                .status(payment.getStatus().name().toUpperCase())
                .orderNumber(payment.getOrder().getOrderNumber())
                .merchantName("Restaurant POS")
                .expiresAt(toOffsetDateTime(payment.getExpiresAt()))
                .build();
    }

    private OffsetDateTime toOffsetDateTime(LocalDateTime value) {
        return value == null ? null : value.atZone(ZoneId.systemDefault()).toOffsetDateTime();
    }

    private boolean expireIfNeeded(Payment payment) {
        if (payment.getStatus() == PaymentStatus.pending
                && payment.getExpiresAt() != null
                && !LocalDateTimeUtil.getTimeNow().isBefore(payment.getExpiresAt())) {
            payment.setStatus(PaymentStatus.failed);
            paymentRepository.save(payment);
            return true;
        }
        return false;
    }
}
