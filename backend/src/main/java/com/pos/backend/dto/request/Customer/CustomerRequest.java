package com.pos.backend.dto.request.Customer;

import java.time.LocalDate;

import org.springframework.web.multipart.MultipartFile;

import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.constant.enums.Gender;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Bound from the multipart/form-data body of the Add/Edit Customer modal. */
@Getter
@Setter
@NoArgsConstructor
public class CustomerRequest {

    @NotBlank(message = "Customer name must not be blank")
    @Size(max = 150, message = "Customer name must not exceed 150 characters")
    private String name;

    @NotBlank(message = "Phone must not be blank")
    @Size(max = 30, message = "Phone must not exceed 30 characters")
    private String phone;

    @Email(message = "Email is invalid")
    private String email;

    private LocalDate dateOfBirth;

    private Gender gender;

    private CommonStatus status;

    private Boolean isWalkin;

    private MultipartFile image;
}
