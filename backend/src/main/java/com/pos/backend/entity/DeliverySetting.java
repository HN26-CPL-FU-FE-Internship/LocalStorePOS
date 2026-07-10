package com.pos.backend.entity;

import java.math.BigDecimal;

import com.pos.backend.entity.enums.DeliveryChargeType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
@Table(name = "delivery_settings")
public class DeliverySetting extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_charge_type", nullable = false)
    private DeliveryChargeType deliveryChargeType = DeliveryChargeType.fixed;

    @Column(name = "fixed_charge", precision = 10, scale = 2)
    private BigDecimal fixedCharge;

    @Column(name = "charge_per_km", precision = 10, scale = 2)
    private BigDecimal chargePerKm;

    @Column(name = "min_distance_for_free_km", precision = 10, scale = 2)
    private BigDecimal minDistanceForFreeKm;

    @Column(name = "max_delivery_distance_km", precision = 10, scale = 2)
    private BigDecimal maxDeliveryDistanceKm;
}