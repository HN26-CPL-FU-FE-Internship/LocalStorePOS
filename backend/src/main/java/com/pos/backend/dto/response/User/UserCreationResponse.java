package com.pos.backend.dto.response.User;

import java.time.LocalDateTime;

import com.pos.backend.entity.enums.CommonStatus;

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
public class UserCreationResponse {

    Long id;

    String firstName;

    String lastName;

    String email;

    String phoneNumber;

    String avatarPath;

    CommonStatus status;

    LocalDateTime updatedAt;

}
