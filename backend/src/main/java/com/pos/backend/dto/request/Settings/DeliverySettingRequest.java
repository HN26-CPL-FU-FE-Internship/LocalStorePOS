package com.pos.backend.dto.request.Settings;

import com.pos.backend.constant.enums.DeliveryChargeType;

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
public class DeliverySettingRequest {

    DeliveryChargeType deliveryChargeType;
    Double fixedCharge;
    Double chargePerKm;
    Double minDistanceForFreeKm;
    Double maxDeliveryDistanceKm;
    Double freeDeliveryOver;
    Double minDeliveryOver;
}
