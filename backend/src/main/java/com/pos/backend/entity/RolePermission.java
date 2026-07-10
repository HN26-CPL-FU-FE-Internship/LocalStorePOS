package com.pos.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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
@Table(name = "role_permissions", uniqueConstraints = {
        @UniqueConstraint(name = "uq_role_module", columnNames = {"role_id", "module_id"})
})

public class RolePermission extends BaseIdEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private PermissionModule module;

    @Builder.Default
    @Column(name = "can_view", nullable = false)
    private boolean canView = false ;

    @Builder.Default
    @Column(name = "can_add", nullable = false)
    private boolean canAdd = false;

    @Builder.Default
    @Column(name = "can_edit", nullable = false)
    private boolean canEdit = false;

    @Builder.Default
    @Column(name = "can_delete", nullable = false)
    private boolean canDelete = false;

    @Builder.Default
    @Column(name = "can_export", nullable = false)
    private boolean canExport = false;

    @Builder.Default
    @Column(name = "can_approve_void", nullable = false)
    private boolean canApproveVoid = false;
}
