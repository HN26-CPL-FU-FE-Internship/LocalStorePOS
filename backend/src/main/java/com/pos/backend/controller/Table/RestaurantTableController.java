package com.pos.backend.controller.Table;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.constant.enums.TableStatus;
import com.pos.backend.dto.request.Table.RestaurantTableRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Table.RestaurantTableResponse;
import com.pos.backend.service.Table.RestaurantTableService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tables")
@RequiredArgsConstructor
public class RestaurantTableController {

    private final RestaurantTableService restaurantTableService;

    @GetMapping
    @PreAuthorize("@perm.hasPermission(authentication, 'Tables', 'view')")
    public ApiResponse<List<RestaurantTableResponse>> getTables(
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) Long floorId,
            @RequestParam(required = false) TableStatus status) {

        return ApiResponse.<List<RestaurantTableResponse>>builder()
                .message("Success")
                .result(restaurantTableService.getTables(areaId, floorId, status))
                .build();
    }

    @PostMapping
    @PreAuthorize("@perm.hasPermission(authentication, 'Tables', 'add')")
    public ApiResponse<RestaurantTableResponse> createTable(@Valid @RequestBody RestaurantTableRequest request) {
        return ApiResponse.<RestaurantTableResponse>builder()
                .message("Table created successfully")
                .result(restaurantTableService.createTable(request))
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("@perm.hasPermission(authentication, 'Tables', 'edit')")
    public ApiResponse<RestaurantTableResponse> updateTable(
            @PathVariable Long id,
            @Valid @RequestBody RestaurantTableRequest request) {

        return ApiResponse.<RestaurantTableResponse>builder()
                .message("Table updated successfully")
                .result(restaurantTableService.updateTable(id, request))
                .build();
    }

    @PatchMapping("/{id}/status")
    // Table status is updated by table managers (Tables edit) AND by the
    // reservation lifecycle (reserve → booked/occupied, cancel/free → available).
    // Cashiers have Tables view + Reservation add, so allow either permission.
    @PreAuthorize("@perm.hasPermission(authentication, 'Tables', 'edit') or @perm.hasPermission(authentication, 'Reservation', 'add')")
    public ApiResponse<RestaurantTableResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam TableStatus status) {

        return ApiResponse.<RestaurantTableResponse>builder()
                .message("Table status updated successfully")
                .result(restaurantTableService.updateStatus(id, status))
                .build();
    }

    // Table deletion must go through the approval workflow for non-admins —
    // only admins may delete tables directly.
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.hasPermission(authentication, 'Tables', 'delete') and @perm.isAdmin(authentication)")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> deleteTable(@PathVariable Long id) {
        restaurantTableService.deleteTable(id);

        return ApiResponse.<Void>builder()
                .message("Table deleted successfully")
                .build();
    }
}
