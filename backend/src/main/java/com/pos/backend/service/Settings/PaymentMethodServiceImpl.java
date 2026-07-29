package com.pos.backend.service.Settings;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.dto.response.Settings.PaymentMethodResponse;
import com.pos.backend.entity.PaymentMethod;
import com.pos.backend.repository.PaymentMethodRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PaymentMethodServiceImpl {

    private final PaymentMethodRepository paymentMethodRepository;

    private static final List<String[]> DEFAULT_METHODS = List.of(
            new String[] { "cash", "Cash" },
            new String[] { "card", "Card" },
            new String[] { "wallet", "Wallet" },
            new String[] { "paypal", "Paypal" },
            new String[] { "qr", "QR Reader" },
            new String[] { "card_reader", "Card Reader" },
            new String[] { "bank", "Bank" });

    private List<PaymentMethod> getOrCreateMethods() {

    List<PaymentMethod> existing = paymentMethodRepository.findAll();

    if (!existing.isEmpty()) {
        return existing;
    }

    List<PaymentMethod> methods = new ArrayList<>();

    for (String[] m : DEFAULT_METHODS) {

        PaymentMethod paymentMethod = PaymentMethod.builder()
                .code(m[0])
                .name(m[1])
                .isEnabled(true)
                .build();

        PaymentMethod saved = paymentMethodRepository.save(paymentMethod);

        methods.add(saved);
    }

    return methods;
}

    @Transactional(readOnly = true)
    public List<PaymentMethodResponse> getAllPaymentMethods() {
        return getOrCreateMethods().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PaymentMethodResponse togglePaymentMethod(Long id) {
        PaymentMethod method = paymentMethodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment method not found"));
        method.setIsEnabled(!method.getIsEnabled());
        method = paymentMethodRepository.save(method);
        return toResponse(method);
    }

    private PaymentMethodResponse toResponse(PaymentMethod method) {
        return PaymentMethodResponse.builder()
                .id(method.getId())
                .code(method.getCode())
                .name(method.getName())
                .isEnabled(method.getIsEnabled())
                .configJson(method.getConfigJson())
                .createdAt(method.getCreatedAt())
                .updatedAt(method.getUpdatedAt())
                .build();
    }
}
