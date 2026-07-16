package com.pos.backend.controller.Administration;

import com.pos.backend.dto.request.Administration.UserPermissionsUpdateRequest;
import com.pos.backend.dto.request.User.UserCreationRequest;
import com.pos.backend.dto.request.User.UserUpdateRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Administration.UserPermissionsResponse;
import com.pos.backend.dto.response.User.UserResponse;
import com.pos.backend.service.Administration.Permission.UserPermissionService;
import com.pos.backend.service.Administration.UserServices.UserServiceImpl;
import com.pos.backend.service.Common.PageResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

        private final UserServiceImpl userService;
        private final UserPermissionService userPermissionService;

        @GetMapping
        public ApiResponse<PageResponse<UserResponse>> getUsers(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size,
                        @RequestParam(defaultValue = "createdAt") String sortBy,
                        @RequestParam(defaultValue = "desc") String sortDir,
                        @RequestParam(required = false) String search,
                        @RequestParam(required = false) String status,
                        @RequestParam(required = false) String roleIds) {
                return ApiResponse.<PageResponse<UserResponse>>builder()
                                .result(userService.getAllUsers(page, size, sortBy, sortDir, search, status, roleIds))
                                .build();
        }

        @GetMapping("/{id}")
        public ApiResponse<UserResponse> getUserById(@PathVariable Long id) {
                return ApiResponse.<UserResponse>builder()
                                .result(userService.getUserById(id))
                                .build();
        }

        @GetMapping("/{id}/permissions")
        public ApiResponse<UserPermissionsResponse> getUserPermissions(@PathVariable Long id) {
                return ApiResponse.<UserPermissionsResponse>builder()
                                .result(userPermissionService.getUserPermissions(id))
                                .build();
        }

        @PutMapping("/{id}/permissions")
        public ApiResponse<Void> updateUserPermissions(
                        @PathVariable Long id,
                        @Valid @RequestBody UserPermissionsUpdateRequest request) {
                userPermissionService.updateUserPermissions(id, request);
                return ApiResponse.<Void>builder()
                                .message("User permissions updated successfully")
                                .build();
        }

        @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ApiResponse<UserResponse> createUser(
                        @RequestPart("user") @Valid UserCreationRequest request,
                        @RequestPart(value = "avatar", required = false) MultipartFile avatarFile) {
                return ApiResponse.<UserResponse>builder()
                                .result(userService.createUser(request, avatarFile))
                                .build();
        }

        @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ApiResponse<UserResponse> updateUser(
                        @PathVariable Long id,
                        @RequestPart("user") @Valid UserUpdateRequest request,
                        @RequestPart(value = "avatar", required = false) MultipartFile avatarFile) {
                return ApiResponse.<UserResponse>builder()
                                .result(userService.updateUser(id, request, avatarFile))
                                .build();
        }

        @DeleteMapping("/{id}")
        public ApiResponse<Void> deleteUser(@PathVariable Long id) {
                userService.deleteUser(id);
                return ApiResponse.<Void>builder()
                                .message("User deleted successfully")
                                .build();
        }
}
