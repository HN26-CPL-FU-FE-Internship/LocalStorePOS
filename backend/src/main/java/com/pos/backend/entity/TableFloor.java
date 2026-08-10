package com.pos.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** table_floors chi co id + name. */
@Entity
@Table(name = "table_floors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableFloor extends BaseIdEntity {

    /** vd: Floor 1, Floor 2 */
    @Column(nullable = false, length = 100)
    private String name;
}
