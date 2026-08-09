package com.pos.backend.service.Settings;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.dto.request.Settings.NotificationSettingRequest;
import com.pos.backend.dto.response.Settings.NotificationSettingResponse;
import com.pos.backend.entity.NotificationConfig;
import com.pos.backend.repository.NotificationConfigRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationSettingServiceImpl {

    private final NotificationConfigRepository notificationConfigRepository;

    private NotificationConfig getOrCreate() {
        return notificationConfigRepository.findAll()
                .stream()
                .findFirst()
                .orElseGet(() -> notificationConfigRepository.save(
                        NotificationConfig.builder().build()));
    }

    @Transactional
    public NotificationSettingResponse getNotificationSetting() {
        // getOrCreate() may persist a default config row when none exists yet,
        // so this getter must run in a read-write transaction.
        return toResponse(getOrCreate());
    }

    @Transactional
    public NotificationSettingResponse updateNotificationSetting(NotificationSettingRequest request) {
        NotificationConfig config = getOrCreate();

        if (request.getMobilePushEnabled() != null) config.setMobilePushEnabled(request.getMobilePushEnabled());
        if (request.getDesktopEnabled() != null) config.setDesktopEnabled(request.getDesktopEnabled());
        if (request.getPaymentPush() != null) config.setPaymentPush(request.getPaymentPush());
        if (request.getPaymentSms() != null) config.setPaymentSms(request.getPaymentSms());
        if (request.getPaymentEmail() != null) config.setPaymentEmail(request.getPaymentEmail());
        if (request.getTransactionPush() != null) config.setTransactionPush(request.getTransactionPush());
        if (request.getTransactionSms() != null) config.setTransactionSms(request.getTransactionSms());
        if (request.getTransactionEmail() != null) config.setTransactionEmail(request.getTransactionEmail());
        if (request.getActivityPush() != null) config.setActivityPush(request.getActivityPush());
        if (request.getActivitySms() != null) config.setActivitySms(request.getActivitySms());
        if (request.getActivityEmail() != null) config.setActivityEmail(request.getActivityEmail());
        if (request.getAccountPush() != null) config.setAccountPush(request.getAccountPush());
        if (request.getAccountSms() != null) config.setAccountSms(request.getAccountSms());
        if (request.getAccountEmail() != null) config.setAccountEmail(request.getAccountEmail());

        config = notificationConfigRepository.save(config);
        return toResponse(config);
    }

    private NotificationSettingResponse toResponse(NotificationConfig config) {
        return NotificationSettingResponse.builder()
                .id(config.getId())
                .mobilePushEnabled(config.getMobilePushEnabled())
                .desktopEnabled(config.getDesktopEnabled())
                .paymentPush(config.getPaymentPush())
                .paymentSms(config.getPaymentSms())
                .paymentEmail(config.getPaymentEmail())
                .transactionPush(config.getTransactionPush())
                .transactionSms(config.getTransactionSms())
                .transactionEmail(config.getTransactionEmail())
                .activityPush(config.getActivityPush())
                .activitySms(config.getActivitySms())
                .activityEmail(config.getActivityEmail())
                .accountPush(config.getAccountPush())
                .accountSms(config.getAccountSms())
                .accountEmail(config.getAccountEmail())
                .createdAt(config.getCreatedAt())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
