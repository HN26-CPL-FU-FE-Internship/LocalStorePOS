package com.pos.backend.service.Authentication;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.dto.request.User.UserCreationRequest;
import com.pos.backend.dto.response.User.UserCreationResponse;
import com.pos.backend.entity.Role;
import com.pos.backend.entity.User;
import com.pos.backend.entity.enums.CommonStatus;
import com.pos.backend.exception.AppException;
import com.pos.backend.mapper.UserMapper;
import com.pos.backend.repository.RoleRepository;
import com.pos.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class RegisterService {

    UserRepository userRepository;
    RoleRepository roleRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;

    public UserCreationResponse registerUser(UserCreationRequest request) {

        if (!userRepository.findByEmail(request.getEmail()).isEmpty()) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        if (!userRepository.findByPhoneNumber(request.getPhoneNumber()).isEmpty()) {
            throw new AppException(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS);
        }
        User user = userMapper.toUser(request);

        Role role = roleRepository.findById(request.getRole())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        user.setRole(role);
        user.setStatus(CommonStatus.active);

        return userMapper.toUserCreationResponse(userRepository.save(user));
    }

}
