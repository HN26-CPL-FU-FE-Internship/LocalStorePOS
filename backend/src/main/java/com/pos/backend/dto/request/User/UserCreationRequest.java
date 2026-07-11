package com.pos.backend.dto.request.User;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCreationRequest {

    @NotBlank(message = "First name must not be blank")
    @Size(max = 100, message = "First name must not exceed 100 characters")
    String firstName;

    @NotBlank(message = "Last name must not be blank")
    @Size(max = 100, message = "Last name must not exceed 100 characters")
    String lastName;

    @NotBlank(message = "Email must not be blank")
    @Email(message = "Email format is invalid")
    @Size(max = 150, message = "Email must not exceed 150 characters")
    String email;

    @NotBlank(message = "Phone number must not be blank")
    @Pattern(regexp = "^\\+?[0-9]{9,15}$", message = "Phone number is invalid")
    String phoneNumber;

    @NotBlank(message = "Password must not be blank")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    String password;

    @NotNull(message = "Vui lòng chọn role cho nhân viên")
    @Positive(message = "roleId không hợp lệ")
    Long role;

    String avatarPath;

}
