package com.pos.backend.entity;

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
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Table(name = "audit_logs")
public class AuditLog extends CreatedAtEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // Stored as a plain string on purpose: audit logs must never fail to load
    // because a historical row uses a value that no longer matches the enum
    // (seed data used lowercase values like "created"/"updated", which crashed
    // the dashboard recent-activity endpoint with "No enum constant").
    @Column(name = "action", nullable = false, length = 50)
    private String action;

    @Column(name = "module", length = 100)
    private String module;

    @Column(name = "entity_type", length = 100)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(name = "action_status", length = 20)
    @Builder.Default
    private String actionStatus = "SUCCESS";

    @Column(name = "ip_address", length = 45)
    private String ipAddress;
}
