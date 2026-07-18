package com.pos.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * permission_modules chi co id + name, khong co created_at/updated_at
 * nen khong ke thua BaseEntity.
 */
@Entity
@Table(name = "permission_modules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class PermissionModule extends BaseIdEntity {
    @Column(nullable = false, unique = true, length = 100)
    private String name;
}
