package com.pos.backend.entity;

import java.time.LocalDateTime;

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

/** held_orders: don hang tam giu (Hold/Resume Sale). Khong co created_at/updated_at chung. */
@Entity
@Table(name = "held_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HeldOrder extends BaseIdEntity{

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "held_by", nullable = false)
    private User heldBy;

    @Column(name = "held_at", nullable = false)
    private LocalDateTime heldAt;

    @Column(name = "resumed_at")
    private LocalDateTime resumedAt;
}
