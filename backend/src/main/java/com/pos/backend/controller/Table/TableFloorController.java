package com.pos.backend.controller.Table;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.dto.request.TableFloor.TableFloorRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Common.OptionResponse;
import com.pos.backend.service.Table.TableFloorService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/table-floors")
@RequiredArgsConstructor
public class TableFloorController {

    private final TableFloorService tableFloorService;

    @GetMapping
    public ApiResponse<List<OptionResponse>> getFloors() {
        return ApiResponse.<List<OptionResponse>>builder()
                .message("Success")
                .result(tableFloorService.getFloors())
                .build();
    }

    @PostMapping
    public ApiResponse<OptionResponse> createFloor(@Valid @RequestBody TableFloorRequest request) {
        return ApiResponse.<OptionResponse>builder()
                .message("Floor created successfully")
                .result(tableFloorService.createFloor(request))
                .build();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> deleteFloor(@PathVariable Long id) {
        tableFloorService.deleteFloor(id);

        return ApiResponse.<Void>builder()
                .message("Floor deleted successfully")
                .build();
    }
}
