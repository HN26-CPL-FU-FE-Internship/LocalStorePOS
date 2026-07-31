package com.pos.backend.controller.Payment;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.constant.enums.PaymentStatus;
import com.pos.backend.dto.request.Payment.QrPaymentConfirmRequest;
import com.pos.backend.dto.request.Payment.QrPaymentCreateRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Payment.PaymentListItemResponse;
import com.pos.backend.dto.response.Payment.QrPaymentConfirmResponse;
import com.pos.backend.dto.response.Payment.QrPaymentInfoResponse;
import com.pos.backend.dto.response.Payment.QrPaymentResponse;
import com.pos.backend.service.Common.PageResponse;
import com.pos.backend.service.Payment.PaymentService;
import com.pos.backend.service.Payment.QrPaymentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final QrPaymentService qrPaymentService;

    @GetMapping
    public ApiResponse<PageResponse<PaymentListItemResponse>> getPayments(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "paidAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PaymentStatus status) {

        PageResponse<PaymentListItemResponse> response = paymentService.getPayments(
                page, size, sortBy, sortDir, search, status);

        return ApiResponse.<PageResponse<PaymentListItemResponse>>builder()
                .message("Success")
                .result(response)
                .build();
    }

    @PostMapping("/create/{orderId}")
    public ApiResponse<QrPaymentResponse> createQrPayment(@PathVariable Long orderId,
            @Valid @RequestBody QrPaymentCreateRequest request) {
        QrPaymentResponse response = qrPaymentService.createQrPayment(orderId, request);
        return ApiResponse.<QrPaymentResponse>builder()
                .message("QR payment created")
                .result(response)
                .build();
    }

    @GetMapping("/{paymentCode}")
    public ApiResponse<QrPaymentInfoResponse> getQrPaymentInfo(@PathVariable String paymentCode) {
        QrPaymentInfoResponse response = qrPaymentService.getPaymentInfo(paymentCode);
        return ApiResponse.<QrPaymentInfoResponse>builder()
                .message("Payment information retrieved")
                .result(response)
                .build();
    }

    @PostMapping("/{paymentCode}/confirm")
    public QrPaymentConfirmResponse confirmQrPayment(@PathVariable String paymentCode,
            @Valid @RequestBody QrPaymentConfirmRequest request) {
        return qrPaymentService.confirmQrPayment(paymentCode, request);
    }

    @PostMapping("/{paymentCode}/cancel")
    public ApiResponse<QrPaymentInfoResponse> cancelQrPayment(@PathVariable String paymentCode) {
        QrPaymentInfoResponse response = qrPaymentService.cancelQrPayment(paymentCode);
        return ApiResponse.<QrPaymentInfoResponse>builder()
                .message("Payment cancelled")
                .result(response)
                .build();
    }
}
