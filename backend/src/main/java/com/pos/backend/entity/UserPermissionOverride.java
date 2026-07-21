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

/**
 * Maps to `user_permission_overrides` table (V5 migration).
 * NULL permission columns = inherit from role_permissions.
 */
@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Table(name = "user_permission_overrides", uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_module", columnNames = { "user_id", "module_id" })
})
public class UserPermissionOverride extends BaseIdEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private PermissionModule module;

    @Builder.Default
    @Column(name = "can_view")
    private Boolean canView = null;

    @Builder.Default
    @Column(name = "can_add")
    private Boolean canAdd = null;

    @Builder.Default
    @Column(name = "can_edit")
    private Boolean canEdit = null;

    @Builder.Default
    @Column(name = "can_delete")
    private Boolean canDelete = null;

    @Builder.Default
    @Column(name = "can_export")
    private Boolean canExport = null;

    @Builder.Default
    @Column(name = "can_approve_void")
    private Boolean canApproveVoid = null;
}
