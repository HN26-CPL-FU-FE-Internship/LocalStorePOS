package com.pos.backend.entity;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "roles")
public class Role extends BaseEntity {
    @Column(name = "name", nullable = false, unique = true, length = 50)
    private String name;
    
    @Builder.Default
    @Column(name = "is_system_role", nullable = false)
    private int isSystemRole = 0;

}
