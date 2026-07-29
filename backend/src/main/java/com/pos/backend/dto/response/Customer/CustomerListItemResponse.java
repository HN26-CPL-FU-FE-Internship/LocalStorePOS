package com.pos.backend.dto.response.Customer;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CustomerListItemResponse {
    private Long id;
    private String name;
    private String phone;
    private String email;
    private String avatarPath;
    private LocalDate dateOfBirth;
    private String gender;
    private String status;
    private Boolean isWalkin;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
