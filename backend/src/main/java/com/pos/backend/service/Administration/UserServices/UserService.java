package com.pos.backend.service.Administration.UserServices;

import java.util.List;

import com.pos.backend.dto.response.Administration.UserListItemResponse;
import com.pos.backend.service.Common.PageResponse;

public interface UserService {
    List<UserListItemResponse> getAllUsers();
}
