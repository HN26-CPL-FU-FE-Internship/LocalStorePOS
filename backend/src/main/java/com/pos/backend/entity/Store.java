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
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Table(name = "stores")
public class Store extends BaseEntity {
    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "image_path", length = 255)
    private String imagePath;

    @Column(name = "address_line1", nullable = false, length = 255)
    private String addressLine1;

    @Column(name = "address_line2", length = 255)
    private String addressLine2;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "email", length = 150)
    private String email;

    @Builder.Default
    @Column(name = "currency_code", nullable = false, length = 10)
    private String currencyCode = "USD";

    @Builder.Default
    @Column(name = "timezone", nullable = false, length = 60)
    private String timezone = "UTC";

    // Feature toggles
    @Builder.Default
    @Column(name = "enable_qr_menu", nullable = false)
    private Boolean enableQrMenu = true;

    @Builder.Default
    @Column(name = "enable_takeaway", nullable = false)
    private Boolean enableTakeaway = true;

    @Builder.Default
    @Column(name = "enable_dine_in", nullable = false)
    private Boolean enableDineIn = true;

    @Builder.Default
    @Column(name = "enable_reservation", nullable = false)
    private Boolean enableReservation = false;

    @Builder.Default
    @Column(name = "enable_order_via_qr", nullable = false)
    private Boolean enableOrderViaQr = true;

    @Builder.Default
    @Column(name = "enable_delivery", nullable = false)
    private Boolean enableDelivery = true;

    @Builder.Default
    @Column(name = "enable_table", nullable = false)
    private Boolean enableTable = true;
}
