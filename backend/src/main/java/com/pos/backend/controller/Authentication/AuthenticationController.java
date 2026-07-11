package com.pos.backend.controller.Authentication;

import com.pos.backend.service.Authentication.LogoutService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.dto.request.Authentication.LoginRequest;
import com.pos.backend.dto.request.Authentication.RefreshTokenRequest;
import com.pos.backend.dto.request.User.UserCreationRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Authentication.LoginResponse;
import com.pos.backend.dto.response.User.UserCreationResponse;
import com.pos.backend.service.Authentication.LoginService;
import com.pos.backend.service.Authentication.RegisterService;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

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

}
