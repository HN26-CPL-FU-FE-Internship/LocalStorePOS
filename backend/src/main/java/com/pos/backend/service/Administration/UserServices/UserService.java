package com.pos.backend.service.Administration.UserServices;

import org.springframework.web.multipart.MultipartFile;

import com.pos.backend.dto.request.User.UserCreationRequest;
import com.pos.backend.dto.request.User.UserUpdateRequest;
import com.pos.backend.dto.response.User.UserResponse;
import com.pos.backend.service.Common.PageResponse;

public interface UserService {

    PageResponse<UserResponse> getAllUsers(int page, int size, String sortBy, String sortDir,
            String search, String status, String roleIds);

    UserResponse getUserById(Long id);

    UserResponse createUser(UserCreationRequest request, MultipartFile avatarFile);

    UserResponse updateUser(Long id, UserUpdateRequest request, MultipartFile avatarFile);

    void deleteUser(Long id);
}
