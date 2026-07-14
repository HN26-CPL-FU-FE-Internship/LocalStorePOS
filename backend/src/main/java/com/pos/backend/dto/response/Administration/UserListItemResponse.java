package com.pos.backend.dto.response.Administration;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserListItemResponse {

    private Long id;

    private String firstName;

    private String lastName;

    private String fullName;

    private String role;

    private String phone;

    private String email;

    private String status;

    private String avatarKey;
}