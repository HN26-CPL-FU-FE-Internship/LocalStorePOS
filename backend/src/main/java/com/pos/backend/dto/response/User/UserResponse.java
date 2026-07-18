package com.pos.backend.dto.response.User;

import java.time.LocalDateTime;

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
public class UserResponse {

    Long id;

    String firstName;

    String lastName;

    String fullName;

    String email;

    String phoneNumber;

    String role;

    String status;

    String avatarPath;

    LocalDateTime createdAt;

    LocalDateTime updatedAt;
}
