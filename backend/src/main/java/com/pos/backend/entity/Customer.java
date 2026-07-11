package com.pos.backend.entity;

import java.time.LocalDate;

import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.constant.enums.Gender;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Customer extends BaseEntity {

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, unique = true, length = 30)
    private String phone;

    @Column(length = 150)
    private String email;

    @Column(name = "avatar_path")
    private String avatarPath;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CommonStatus status = CommonStatus.active;

    /** Khach vang lai (walk-in) */
    @Builder.Default
    @Column(name = "is_walkin", nullable = false)
    private Boolean isWalkin = false;
}
