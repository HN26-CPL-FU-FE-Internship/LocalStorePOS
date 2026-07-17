package com.pos.backend.controller.Authentication;

import com.pos.backend.service.Authentication.LogoutService;
import com.pos.backend.service.Administration.Permission.UserPermissionService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.dto.request.Authentication.LoginRequest;
import com.pos.backend.dto.request.Authentication.RefreshTokenRequest;
import com.pos.backend.dto.request.User.UserCreationRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Authentication.LoginResponse;
import com.pos.backend.dto.response.User.UserCreationResponse;
import com.pos.backend.entity.User;
import com.pos.backend.repository.UserRepository;
import com.pos.backend.service.Authentication.LoginService;
import com.pos.backend.service.Authentication.RegisterService;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {

    LogoutService logoutService;
    RegisterService registerService;
    LoginService loginService;
    UserPermissionService userPermissionService;
    UserRepository userRepository;

    @PostMapping("/register")
    public ApiResponse<UserCreationResponse> register(@RequestBody @Valid UserCreationRequest request) {

        UserCreationResponse response = registerService.registerUser(request);
        return ApiResponse.<UserCreationResponse>builder()
                .message("Success")
                .result(response)
                .build();
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody @Valid LoginRequest request) {

        LoginResponse response = loginService.login(request);
        return ApiResponse.<LoginResponse>builder()
                .message("Success")
                .result(response)
                .build();
    }

    @PostMapping("/refresh")
    public ApiResponse<LoginResponse> refresh(@RequestBody @Valid RefreshTokenRequest request) {

        LoginResponse response = loginService.refreshToken(request.getRefreshToken());
        return ApiResponse.<LoginResponse>builder()
                .message("Success")
                .result(response)
                .build();
    }

    @PostMapping("/logout")
    public void logout(@RequestBody @Valid RefreshTokenRequest request) {
        logoutService.logout(request.getRefreshToken());
    }

    @GetMapping("/me")
    public ApiResponse<LoginResponse.UserInfo> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmailWithRole(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        var permissions = userPermissionService.getEffectivePermissions(user);

        LoginResponse.UserInfo userInfo = LoginResponse.UserInfo.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole().getName())
                .avatarPath(user.getAvatarPath())
                .permissions(permissions)
                .build();

        return ApiResponse.<LoginResponse.UserInfo>builder()
                .message("Success")
                .result(userInfo)
                .build();
    }

}
