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
public class StoreSettingResponse {
    Long id;
    String name;
    String imagePath;
    String addressLine1;
    String addressLine2;
    String city;
    String state;
    String country;
    String postalCode;
    String email;
    String phone;
    String currencyCode;
    String timezone;
    Boolean enableQrMenu;
    Boolean enableTakeaway;
    Boolean enableDineIn;
    Boolean enableReservation;
    Boolean enableOrderViaQr;
    Boolean enableDelivery;
    Boolean enableTable;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
