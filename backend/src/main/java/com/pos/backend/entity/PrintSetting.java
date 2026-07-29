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
@Table(name = "print_settings")
public class PrintSetting extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @Builder.Default
    @Column(name = "enable_print", nullable = false)
    private Boolean enablePrint = true;

    @Builder.Default
    @Column(name = "show_store_details", nullable = false)
    private Boolean showStoreDetails = true;

    @Builder.Default
    @Column(name = "show_customer_details", nullable = false)
    private Boolean showCustomerDetails = true;

    @Builder.Default
    @Column(name = "page_size", nullable = false, length = 10)
    private String pageSize = "A4";

    @Builder.Default
    @Column(name = "show_notes", nullable = false)
    private Boolean showNotes = true;

    @Builder.Default
    @Column(name = "print_tokens", nullable = false)
    private Boolean printTokens = true;

    @Column(name = "header_text", columnDefinition = "text")
    private String headerText;

    @Column(name = "footer_text", columnDefinition = "text")
    private String footerText;
}
