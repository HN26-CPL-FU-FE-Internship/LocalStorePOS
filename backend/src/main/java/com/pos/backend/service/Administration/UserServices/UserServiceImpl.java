package com.pos.backend.service.Administration.UserServices;

import com.pos.backend.dto.response.Administration.UserListItemResponse;
import com.pos.backend.entity.User;
import com.pos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
        public List<UserListItemResponse> getAllUsers() {
    return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private UserListItemResponse toResponse(User user) {

        return UserListItemResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFirstName() + " " + user.getLastName())
                .role(user.getRole().getName()) // nếu Role là Entity
                // .role(user.getRole().name()) // nếu Role là Enum
                .phone(user.getPhoneNumber())
                .email(user.getEmail())
                .status(user.getStatus().name()) // nếu Status là Enum
                .avatarKey(user.getAvatarPath())
                .build();
    }
}