package com.pos.backend.dto.request.POS;

import com.pos.backend.constant.enums.Gender;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateCustomerRequest {

    @NotBlank(message = "Customer name is required")
    @Size(max = 150, message = "Customer name must not exceed 150 characters")
    String name;

    @NotBlank(message = "Phone number is required")
    @Size(max = 30, message = "Phone number must not exceed 30 characters")
    String phone;

    @Size(max = 150, message = "Email must not exceed 150 characters")
    String email;

    Gender gender;
}
