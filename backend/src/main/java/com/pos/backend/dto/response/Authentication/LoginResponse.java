package com.pos.backend.dto.response.Authentication;

import java.util.List;

import com.pos.backend.dto.response.Administration.PermissionModuleResponse;

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
public class LoginResponse {

    String accessToken;
    String refreshToken;
    UserInfo user;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class UserInfo {
        Long id;
        String firstName;
        String lastName;
        String email;
        String phoneNumber;
        String role;
        String avatarPath;
        String status;
        List<PermissionModuleResponse> permissions;
    }
}
