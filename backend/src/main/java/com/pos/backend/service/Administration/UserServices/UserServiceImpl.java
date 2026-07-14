package com.pos.backend.service.Administration.UserServices;

import java.util.List;

import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.dto.response.Administration.UserListItemResponse;
import com.pos.backend.entity.User;
import com.pos.backend.repository.UserRepository;
import com.pos.backend.service.Common.PageResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<UserListItemResponse> getUsers(
            int page,
            int size,
            String sortBy,
            String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page - 1, size, sort);

        Page<User> userPage = userRepository.findAll(pageable);

        List<UserListItemResponse> users = userPage.getContent()
                .stream()
                .map(user -> UserListItemResponse.builder()
                        .id(user.getId())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .fullName(user.getFirstName() + " " + user.getLastName())
                        .role(user.getRole().getName())
                        .phone(user.getPhoneNumber())
                        .email(user.getEmail())
                        .status(user.getStatus().name())
                        .avatarKey(user.getAvatarPath())
                        .build())
                .toList();

        return PageResponse.<UserListItemResponse>builder()
                .items(users)
                .page(page)
                .size(size)
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .first(userPage.isFirst())
                .last(userPage.isLast())
                .build();
    }
}
