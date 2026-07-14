package com.pos.backend.controller.Administration;

import com.pos.backend.dto.response.Administration.UserListItemResponse;
import com.pos.backend.service.Administration.UserServices.UserServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UsersListItemController {

    private final UserServiceImpl userService;

    @GetMapping
    public List<UserListItemResponse> getUsers() {
        return userService.getAllUsers();
    }

}