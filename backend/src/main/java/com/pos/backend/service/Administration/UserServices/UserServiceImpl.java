package com.pos.backend.service.Administration.UserServices;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.dto.request.User.UserCreationRequest;
import com.pos.backend.dto.request.User.UserUpdateRequest;
import com.pos.backend.dto.response.User.UserResponse;
import com.pos.backend.entity.Role;
import com.pos.backend.entity.User;
import com.pos.backend.exception.AppException;
import com.pos.backend.mapper.UserMapper;
import com.pos.backend.repository.RoleRepository;
import com.pos.backend.repository.UserRepository;
import com.pos.backend.service.Common.PageResponse;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.persistence.criteria.Predicate;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class UserServiceImpl implements UserService {

    static final String UPLOAD_DIR = "uploads/avatars/";

    UserRepository userRepository;
    RoleRepository roleRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;

    @Override
    public PageResponse<UserResponse> getAllUsers(int page, int size, String sortBy, String sortDir,
            String search, String status, String roleIds) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<User> spec = buildFilterSpec(search, status, roleIds);
        Page<User> userPage = userRepository.findAll(spec, pageable);

        return PageResponse.<UserResponse>builder()
                .items(userPage.getContent().stream()
                        .map(this::toUserResponse)
                        .toList())
                .page(userPage.getNumber())
                .size(userPage.getSize())
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .first(userPage.isFirst())
                .last(userPage.isLast())
                .build();
    }

    @Override
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return toUserResponse(user);
    }

    @Override
    public UserResponse createUser(UserCreationRequest request, MultipartFile avatarFile) {
        // Check email uniqueness
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        // Check phone uniqueness
        if (userRepository.findByPhoneNumber(request.getPhoneNumber()).isPresent()) {
            throw new AppException(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS);
        }

        User user = userMapper.toUser(request);

        // Set role
        Role role = roleRepository.findById(request.getRole())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
        user.setRole(role);

        // Hash password
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));

        // Set default status
        if (user.getStatus() == null) {
            user.setStatus(CommonStatus.active);
        }

        // Handle avatar upload
        if (avatarFile != null && !avatarFile.isEmpty()) {
            String avatarPath = saveAvatarFile(avatarFile);
            user.setAvatarPath(avatarPath);
        }

        return toUserResponse(userRepository.save(user));
    }

    @Override
    public UserResponse updateUser(Long id, UserUpdateRequest request, MultipartFile avatarFile) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Check email uniqueness if changed
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
            }
        }

        // Check phone uniqueness if changed
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().equals(user.getPhoneNumber())) {
            if (userRepository.findByPhoneNumber(request.getPhoneNumber()).isPresent()) {
                throw new AppException(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS);
            }
        }

        // Update role if provided
        if (request.getRole() != null) {
            Role role = roleRepository.findById(request.getRole())
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
            user.setRole(role);
        }

        // Update fields from request (ignore nulls)
        userMapper.updateUserFromRequest(request, user);

        // Hash password if provided
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        // Handle avatar upload
        if (avatarFile != null && !avatarFile.isEmpty()) {
            // Delete old avatar if exists
            if (user.getAvatarPath() != null) {
                deleteAvatarFile(user.getAvatarPath());
            }
            String avatarPath = saveAvatarFile(avatarFile);
            user.setAvatarPath(avatarPath);
        }

        return toUserResponse(userRepository.save(user));
    }

    @Override
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Delete avatar file if exists
        if (user.getAvatarPath() != null) {
            deleteAvatarFile(user.getAvatarPath());
        }

        userRepository.delete(user);
    }

    /* ---------------------------------------------------------------- */
    /* Helper methods */
    /* ---------------------------------------------------------------- */

    private Specification<User> buildFilterSpec(String search, String status, String roleIds) {
        return (root, query, criteriaBuilder) -> {
            Predicate predicate = criteriaBuilder.conjunction();

            // Multi-term search: split by whitespace, each term must match ANY field,
            // ALL terms must match for the record to be returned.
            // e.g. "flo 912" → firstName ILIKE '%flo%' AND phone ILIKE '%912%' → matched
            if (StringUtils.hasText(search)) {
                String[] terms = search.trim().split("\\s+");
                Predicate[] termPredicates = new Predicate[terms.length];
                for (int i = 0; i < terms.length; i++) {
                    String pattern = "%" + terms[i].toLowerCase() + "%";
                    termPredicates[i] = criteriaBuilder.or(
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("firstName")), pattern),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("lastName")), pattern),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), pattern),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("phoneNumber")), pattern));
                }
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.and(termPredicates));
            }

            // Filter by status
            if (StringUtils.hasText(status)) {
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.equal(root.get("status"),
                                com.pos.backend.constant.enums.CommonStatus.valueOf(status)));
            }

            // Filter by role IDs (comma-separated)
            if (StringUtils.hasText(roleIds)) {
                String[] ids = roleIds.split(",");
                jakarta.persistence.criteria.CriteriaBuilder.In<Long> inClause = criteriaBuilder
                        .in(root.get("role").get("id"));
                for (String id : ids) {
                    try {
                        inClause.value(Long.parseLong(id.trim()));
                    } catch (NumberFormatException e) {
                        // Skip invalid IDs
                    }
                }
                predicate = criteriaBuilder.and(predicate, inClause);
            }

            return predicate;
        };
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFirstName() + " " + user.getLastName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole().getName())
                .status(user.getStatus().name())
                .avatarPath(user.getAvatarPath())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private String saveAvatarFile(MultipartFile file) {
        String originalFilename = StringUtils.cleanPath(
                Objects.requireNonNull(file.getOriginalFilename()));

        if (originalFilename.isBlank()) {
            throw new AppException(ErrorCode.INVALID_AVATAR_FILE);
        }

        // Generate unique filename
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex);
        }
        String uniqueFilename = UUID.randomUUID().toString() + extension;

        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/avatars/" + uniqueFilename;
        } catch (IOException e) {
            throw new AppException(ErrorCode.CAN_NOT_UPLOAD_FILE);
        }
    }

    private void deleteAvatarFile(String avatarPath) {
        try {
            String filename = avatarPath.substring(avatarPath.lastIndexOf('/') + 1);
            Path filePath = Paths.get(UPLOAD_DIR).resolve(filename);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log error but don't throw — deleting avatar is not critical
            System.err.println("Failed to delete avatar file: " + avatarPath);
        }
    }
}