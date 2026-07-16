package com.pos.backend.controller.Administration;

import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Administration.RoleResponse;
import com.pos.backend.repository.RoleRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleRepository roleRepository;

    @GetMapping
    public ApiResponse<List<RoleResponse>> getRoles() {
        List<RoleResponse> roles = roleRepository.findAll()
                .stream()
                .map(role -> RoleResponse.builder()
                        .id(role.getId())
                        .name(role.getName())
                        .build())
                .toList();
        return ApiResponse.<List<RoleResponse>>builder()
                .result(roles)
                .build();
    }
}
