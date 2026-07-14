package com.pos.backend.service.Administration.UserServices;

import com.pos.backend.dto.response.Administration.UserListItemResponse;
import com.pos.backend.service.Common.PageResponse;

public interface UserService {

    PageResponse<UserListItemResponse> getUsers(
            int page,
            int size,
            String sortBy,
            String sortDir);
}
