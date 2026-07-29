package com.pos.backend.controller.Settings;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Settings.PaymentMethodResponse;
import com.pos.backend.service.Settings.PaymentMethodServiceImpl;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payment-methods")
@RequiredArgsConstructor
public class PaymentMethodController {

    private final PaymentMethodServiceImpl paymentMethodService;

    @GetMapping
    public ApiResponse<List<PaymentMethodResponse>> getAllPaymentMethods() {
        return ApiResponse.<List<PaymentMethodResponse>>builder()
                .message("Success")
                .result(paymentMethodService.getAllPaymentMethods())
                .build();
    }

    @PatchMapping("/{id}/toggle")
    public ApiResponse<PaymentMethodResponse> togglePaymentMethod(@PathVariable Long id) {
        return ApiResponse.<PaymentMethodResponse>builder()
                .message("Payment method toggled successfully")
                .result(paymentMethodService.togglePaymentMethod(id))
                .build();
    }
}
