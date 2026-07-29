package com.pos.backend.controller.Payment;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.constant.enums.PaymentStatus;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Payment.PaymentListItemResponse;
import com.pos.backend.service.Common.PageResponse;
import com.pos.backend.service.Payment.PaymentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

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
}
