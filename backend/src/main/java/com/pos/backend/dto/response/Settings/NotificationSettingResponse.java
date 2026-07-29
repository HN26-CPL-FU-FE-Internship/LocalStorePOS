package com.pos.backend.dto.response.Settings;

import java.time.LocalDateTime;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NotificationSettingResponse {
    Long id;
    Boolean mobilePushEnabled;
    Boolean desktopEnabled;
    Boolean paymentPush;
    Boolean paymentSms;
    Boolean paymentEmail;
    Boolean transactionPush;
    Boolean transactionSms;
    Boolean transactionEmail;
    Boolean activityPush;
    Boolean activitySms;
    Boolean activityEmail;
    Boolean accountPush;
    Boolean accountSms;
    Boolean accountEmail;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
