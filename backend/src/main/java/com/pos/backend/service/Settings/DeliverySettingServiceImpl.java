package com.pos.backend.service.Settings;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.enums.DeliveryChargeType;
import com.pos.backend.dto.request.Settings.DeliverySettingRequest;
import com.pos.backend.dto.response.Settings.DeliverySettingResponse;
import com.pos.backend.entity.DeliverySetting;
import com.pos.backend.entity.Store;
import com.pos.backend.repository.DeliverySettingRepository;
import com.pos.backend.repository.StoreRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DeliverySettingServiceImpl {

    private final DeliverySettingRepository deliverySettingRepository;
    private final StoreRepository storeRepository;

    private Store getOrCreateStore() {
        return storeRepository.findAll()
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No store configured"));
    }

    private DeliverySetting getOrCreate() {
        return deliverySettingRepository.findAll()
                .stream()
                .findFirst()
                .orElseGet(() -> deliverySettingRepository.save(
                        DeliverySetting.builder()
                                .store(getOrCreateStore())
                                .deliveryChargeType(DeliveryChargeType.fixed)
                                .fixedCharge(BigDecimal.ZERO)
                                .build()));
    }

    @Transactional(readOnly = true)
    public DeliverySettingResponse getDeliverySetting() {
        return toResponse(getOrCreate());
    }

    @Transactional
    public DeliverySettingResponse updateDeliverySetting(DeliverySettingRequest request) {
        DeliverySetting setting = getOrCreate();

        if (request.getDeliveryChargeType() != null) {
            setting.setDeliveryChargeType(request.getDeliveryChargeType());
        }
        if (request.getFixedCharge() != null) {
            setting.setFixedCharge(BigDecimal.valueOf(request.getFixedCharge()));
        }
        if (request.getChargePerKm() != null) {
            setting.setChargePerKm(BigDecimal.valueOf(request.getChargePerKm()));
        }
        if (request.getMinDistanceForFreeKm() != null) {
            setting.setMinDistanceForFreeKm(BigDecimal.valueOf(request.getMinDistanceForFreeKm()));
        }
        if (request.getMaxDeliveryDistanceKm() != null) {
            setting.setMaxDeliveryDistanceKm(BigDecimal.valueOf(request.getMaxDeliveryDistanceKm()));
        }
        if (request.getFreeDeliveryOver() != null) {
            setting.setFreeDeliveryOver(BigDecimal.valueOf(request.getFreeDeliveryOver()));
        }
        if (request.getMinDeliveryOver() != null) {
            setting.setMinDeliveryOver(BigDecimal.valueOf(request.getMinDeliveryOver()));
        }

        setting = deliverySettingRepository.save(setting);
        return toResponse(setting);
    }

    private DeliverySettingResponse toResponse(DeliverySetting setting) {
        return DeliverySettingResponse.builder()
                .id(setting.getId())
                .deliveryChargeType(setting.getDeliveryChargeType().name())
                .fixedCharge(setting.getFixedCharge() != null ? setting.getFixedCharge().doubleValue() : null)
                .chargePerKm(setting.getChargePerKm() != null ? setting.getChargePerKm().doubleValue() : null)
                .minDistanceForFreeKm(setting.getMinDistanceForFreeKm() != null ? setting.getMinDistanceForFreeKm().doubleValue() : null)
                .maxDeliveryDistanceKm(setting.getMaxDeliveryDistanceKm() != null ? setting.getMaxDeliveryDistanceKm().doubleValue() : null)
                .freeDeliveryOver(setting.getFreeDeliveryOver() != null ? setting.getFreeDeliveryOver().doubleValue() : null)
                .minDeliveryOver(setting.getMinDeliveryOver() != null ? setting.getMinDeliveryOver().doubleValue() : null)
                .createdAt(setting.getCreatedAt())
                .updatedAt(setting.getUpdatedAt())
                .build();
    }
}
