package com.pos.backend.service.Payment;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.enums.PaymentStatus;
import com.pos.backend.dto.response.Payment.PaymentListItemResponse;
import com.pos.backend.entity.Order;
import com.pos.backend.entity.Payment;
import com.pos.backend.repository.OrderItemRepository;
import com.pos.backend.repository.PaymentRepository;
import com.pos.backend.service.Common.PageResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderItemRepository orderItemRepository;
    private final com.pos.backend.repository.OrderRepository orderRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PaymentListItemResponse> getPayments(
            int page,
            int size,
            String sortBy,
            String sortDir,
            String search,
            PaymentStatus status) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page - 1, size, sort);

        String normalizedSearch = (search == null || search.isBlank()) ? null : search.trim();

        Page<Payment> paymentPage = paymentRepository.search(normalizedSearch, status, pageable);

        Map<Long, Long> itemCountByOrderId = countItemsByOrder(paymentPage.getContent());

        List<PaymentListItemResponse> payments = paymentPage.getContent()
                .stream()
                .map(payment -> toResponse(payment, itemCountByOrderId.getOrDefault(payment.getOrder().getId(), 0L)))
                .toList();

        return PageResponse.<PaymentListItemResponse>builder()
                .items(payments)
                .page(page)
                .size(size)
                .totalElements(paymentPage.getTotalElements())
                .totalPages(paymentPage.getTotalPages())
                .first(paymentPage.isFirst())
                .last(paymentPage.isLast())
                .build();
    }

    private Map<Long, Long> countItemsByOrder(List<Payment> payments) {
        Map<Long, Long> result = new HashMap<>();

        if (payments.isEmpty()) {
            return result;
        }

        List<Long> orderIds = payments.stream().map(p -> p.getOrder().getId()).distinct().toList();

        for (Object[] row : orderItemRepository.countItemsByOrderIds(orderIds)) {
            result.put((Long) row[0], (Long) row[1]);
        }

        return result;
    }

    @Override
    @Transactional
    public PaymentListItemResponse refundPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new com.pos.backend.exception.AppException(
                        com.pos.backend.constant.ErrorCode.NOTIFICATION_NOT_FOUND));

        payment.setStatus(PaymentStatus.refunded);
        paymentRepository.save(payment);

        Order order = payment.getOrder();
        order.setPaymentStatus(com.pos.backend.constant.enums.OrderPaymentStatus.refunded);
        orderRepository.save(order);

        return toResponse(payment, 0);
    }

    private PaymentListItemResponse toResponse(Payment payment, long itemCount) {
        Order order = payment.getOrder();

        return PaymentListItemResponse.builder()
                .id(payment.getId())
                .transactionId(payment.getTransactionId())
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .tokenNo(order.getTokenNo())
                .customerId(order.getCustomer() != null ? order.getCustomer().getId() : null)
                .customerName(order.getCustomer() != null ? order.getCustomer().getName() : "Walk-in Customer")
                .customerAvatarPath(order.getCustomer() != null ? order.getCustomer().getAvatarPath() : null)
                .orderType(order.getOrderType().name())
                .itemCount(itemCount)
                .grandTotal(order.getGrandTotal())
                .paymentMethodName(payment.getPaymentMethod().getName())
                .status(payment.getStatus().name())
                .paidAt(payment.getPaidAt())
                .build();
    }
}
