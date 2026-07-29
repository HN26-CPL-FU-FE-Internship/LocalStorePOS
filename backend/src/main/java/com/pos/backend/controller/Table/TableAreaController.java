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

import com.pos.backend.dto.request.TableArea.TableAreaRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Common.OptionResponse;
import com.pos.backend.service.Table.TableAreaService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/table-areas")
@RequiredArgsConstructor
public class TableAreaController {

    private final TableAreaService tableAreaService;

    @GetMapping
    public ApiResponse<List<OptionResponse>> getAreas() {
        return ApiResponse.<List<OptionResponse>>builder()
                .message("Success")
                .result(tableAreaService.getAreas())
                .build();
    }

    @PostMapping
    public ApiResponse<OptionResponse> createArea(@Valid @RequestBody TableAreaRequest request) {
        return ApiResponse.<OptionResponse>builder()
                .message("Area created successfully")
                .result(tableAreaService.createArea(request))
                .build();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> deleteArea(@PathVariable Long id) {
        tableAreaService.deleteArea(id);

        return ApiResponse.<Void>builder()
                .message("Area deleted successfully")
                .build();
    }
}
