package com.pos.backend.service.Payment;

import com.pos.backend.dto.request.Payment.QrPaymentConfirmRequest;
import com.pos.backend.dto.request.Payment.QrPaymentCreateRequest;
import com.pos.backend.dto.response.Payment.QrPaymentConfirmResponse;
import com.pos.backend.dto.response.Payment.QrPaymentInfoResponse;
import com.pos.backend.dto.response.Payment.QrPaymentResponse;

public interface QrPaymentService {
    QrPaymentResponse createQrPayment(Long orderId, QrPaymentCreateRequest request);

    QrPaymentInfoResponse getPaymentInfo(String paymentCode);

    QrPaymentConfirmResponse confirmQrPayment(String paymentCode, QrPaymentConfirmRequest request);

    QrPaymentInfoResponse cancelQrPayment(String paymentCode);
}
