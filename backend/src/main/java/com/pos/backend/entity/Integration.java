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
@Table(name = "integrations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Integration extends BaseEntity {

    /** google, facebook, gupshup, printnode */
    @Column(name = "provider_code", nullable = false, unique = true, length = 50)
    private String providerCode;

    @Column(name = "provider_name", nullable = false, length = 100)
    private String providerName;

    @Builder.Default
    @Column(name = "is_connected", nullable = false)
    private Boolean isConnected = false;

    @Column(name = "config_json", columnDefinition = "json")
    private String configJson;
}
