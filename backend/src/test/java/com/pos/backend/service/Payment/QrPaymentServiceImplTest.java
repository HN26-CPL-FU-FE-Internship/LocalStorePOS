package com.pos.backend.service.Payment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.pos.backend.constant.enums.OrderPaymentStatus;
import com.pos.backend.constant.enums.OrderStatus;
import com.pos.backend.constant.enums.PaymentStatus;
import com.pos.backend.dto.request.Payment.QrPaymentConfirmRequest;
import com.pos.backend.dto.request.Payment.QrPaymentCreateRequest;
import com.pos.backend.dto.response.Payment.QrPaymentResponse;
import com.pos.backend.entity.Order;
import com.pos.backend.entity.Payment;
import com.pos.backend.entity.PaymentMethod;
import com.pos.backend.mapper.OrderMapper;
import com.pos.backend.repository.CouponRepository;
import com.pos.backend.repository.OrderRepository;
import com.pos.backend.repository.PaymentMethodRepository;
import com.pos.backend.repository.PaymentRepository;
import com.pos.backend.repository.RestaurantTableRepository;
import com.pos.backend.service.NotificationService;
import com.pos.backend.service.WebSocket.WebSocketService;

@ExtendWith(MockitoExtension.class)
class QrPaymentServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private PaymentMethodRepository paymentMethodRepository;
    @Mock
    private CouponRepository couponRepository;
    @Mock
    private RestaurantTableRepository restaurantTableRepository;
    @Mock
    private OrderMapper orderMapper;
    @Mock
    private WebSocketService webSocketService;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private QrPaymentServiceImpl service;

    @Test
    void createQrPaymentInvalidatesOlderPendingQrForSameOrder() {
        Order order = pendingOrder();
        PaymentMethod qrMethod = PaymentMethod.builder().code("qr").name("QR Payment").build();
        when(orderRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(order));
        when(paymentMethodRepository.findByCode("qr")).thenReturn(Optional.of(qrMethod));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        QrPaymentResponse response = service.createQrPayment(10L, new QrPaymentCreateRequest());

        verify(paymentRepository).invalidatePendingQrPayments(10L);
        assertNotNull(response.getExpiresAt());
        org.mockito.ArgumentCaptor<Payment> captor = org.mockito.ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());
        Payment created = captor.getValue();
        assertEquals(PaymentStatus.pending, created.getStatus());
        long expirationSeconds = java.time.Duration.between(LocalDateTime.now(), created.getExpiresAt()).getSeconds();
        assertEquals(900L, expirationSeconds, 2L);
    }

    @Test
    void confirmQrPaymentRejectsAndMarksExpiredQrAsFailed() {
        Payment payment = Payment.builder()
                .transactionId("TXN-EXPIRED")
                .paymentCode("PAY-EXPIRED")
                .order(pendingOrder())
                .paymentMethod(PaymentMethod.builder().code("qr").name("QR Payment").build())
                .amount(new BigDecimal("100.00"))
                .status(PaymentStatus.pending)
                .expiresAt(LocalDateTime.now().minusSeconds(1))
                .build();
        when(paymentRepository.findByPaymentCodeForUpdate("PAY-EXPIRED")).thenReturn(Optional.of(payment));

        var response = service.confirmQrPayment("PAY-EXPIRED",
                new QrPaymentConfirmRequest(new BigDecimal("100.00")));

        assertEquals("EXPIRED", response.getStatus());
        assertEquals(PaymentStatus.failed, payment.getStatus());
        verify(paymentRepository).save(payment);
    }

    private Order pendingOrder() {
        return Order.builder()
                .id(10L)
                .orderNumber("ORD-10")
                .status(OrderStatus.pending)
                .paymentStatus(OrderPaymentStatus.unpaid)
                .subtotal(new BigDecimal("100.00"))
                .taxAmount(BigDecimal.ZERO)
                .serviceCharge(BigDecimal.ZERO)
                .deliveryCharge(BigDecimal.ZERO)
                .tipAmount(BigDecimal.ZERO)
                .build();
    }

}
