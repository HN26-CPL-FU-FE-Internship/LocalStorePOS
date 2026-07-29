package com.pos.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Table(name = "notification_configs")
public class NotificationConfig extends BaseEntity {

    @Builder.Default
    @Column(name = "mobile_push_enabled", nullable = false)
    private Boolean mobilePushEnabled = true;

    @Builder.Default
    @Column(name = "desktop_enabled", nullable = false)
    private Boolean desktopEnabled = true;

    @Builder.Default
    @Column(name = "payment_push", nullable = false)
    private Boolean paymentPush = true;

    @Builder.Default
    @Column(name = "payment_sms", nullable = false)
    private Boolean paymentSms = true;

    @Builder.Default
    @Column(name = "payment_email", nullable = false)
    private Boolean paymentEmail = true;

    @Builder.Default
    @Column(name = "transaction_push", nullable = false)
    private Boolean transactionPush = true;

    @Builder.Default
    @Column(name = "transaction_sms", nullable = false)
    private Boolean transactionSms = true;

    @Builder.Default
    @Column(name = "transaction_email", nullable = false)
    private Boolean transactionEmail = false;

    @Builder.Default
    @Column(name = "activity_push", nullable = false)
    private Boolean activityPush = true;

    @Builder.Default
    @Column(name = "activity_sms", nullable = false)
    private Boolean activitySms = true;

    @Builder.Default
    @Column(name = "activity_email", nullable = false)
    private Boolean activityEmail = true;

    @Builder.Default
    @Column(name = "account_push", nullable = false)
    private Boolean accountPush = true;

    @Builder.Default
    @Column(name = "account_sms", nullable = false)
    private Boolean accountSms = true;

    @Builder.Default
    @Column(name = "account_email", nullable = false)
    private Boolean accountEmail = true;
}
