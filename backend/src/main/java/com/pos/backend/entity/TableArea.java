package com.pos.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** table_areas chi co id + name, khong co created_at/updated_at. */
@Entity
@Table(name = "table_areas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableArea extends BaseIdEntity{

    /** vd: Main Hall, Rooftop, VIP */
    @Column(nullable = false, length = 100)
    private String name;
}
