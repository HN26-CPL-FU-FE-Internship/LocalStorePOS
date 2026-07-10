package com.pos.backend.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * order_item_addons: addon da chon cho tung dong mon. Khong co
 * created_at/updated_at.
 */
@Entity
@Table(name = "order_item_addons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemAddon extends BaseIdEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "addon_id", nullable = false)
    private Addon addon;

    /** Snapshot */
    @Column(name = "addon_name", nullable = false, length = 150)
    private String addonName;

    /** Snapshot */
    @Column(name = "addon_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal addonPrice;

    @Builder.Default
    @Column(nullable = false)
    private Integer quantity = 1;
}
