package com.pos.backend.controller.Administration;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.dto.response.Administration.UserListItemResponse;
import com.pos.backend.service.Administration.UserServices.UserServiceImpl;
import com.pos.backend.service.Common.PageResponse;

@RestController
@RequestMapping("/api/users")
public class UsersListItemController {
    private final UserServiceImpl userService;

    public UsersListItemController(UserServiceImpl userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<UserListItemResponse>> getUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        return ResponseEntity.ok(
                userService.getUsers(page, size, sortBy, sortDir));
    }
}
