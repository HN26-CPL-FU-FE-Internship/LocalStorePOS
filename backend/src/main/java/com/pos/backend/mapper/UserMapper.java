package com.pos.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.pos.backend.dto.request.User.UserCreationRequest;
import com.pos.backend.dto.response.User.UserCreationResponse;
import com.pos.backend.entity.User;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "emailVerifiedAt", ignore = true)
    @Mapping(target = "lastLoginAt", ignore = true)
    @Mapping(target = "passwordHash", source = "password")
    User toUser(UserCreationRequest request);

    UserCreationResponse toUserCreationResponse(User user);
}
