package com.pos.backend.entity;

import java.math.BigDecimal;

import com.pos.backend.entity.enums.CommonStatus;
import com.pos.backend.entity.enums.TaxType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "taxes")
public class Tax extends BaseEntity {
    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @Column(name = "tax_rate", nullable = false, precision = 6, scale = 2)
    private BigDecimal taxRate;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "tax_type", nullable = false)
    private TaxType taxType = TaxType.exclusive;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private CommonStatus status = CommonStatus.active;
}
