package com.pos.backend.controller.Settings;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Settings.IntegrationSettingResponse;
import com.pos.backend.service.Settings.IntegrationSettingServiceImpl;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/integrations")
@RequiredArgsConstructor
public class IntegrationSettingController {

    private final IntegrationSettingServiceImpl integrationSettingService;

    @GetMapping
    public ApiResponse<List<IntegrationSettingResponse>> getAllIntegrations() {
        return ApiResponse.<List<IntegrationSettingResponse>>builder()
                .message("Success")
                .result(integrationSettingService.getAllIntegrations())
                .build();
    }

    @PatchMapping("/{id}/toggle")
    public ApiResponse<IntegrationSettingResponse> toggleIntegration(@PathVariable Long id) {
        return ApiResponse.<IntegrationSettingResponse>builder()
                .message("Integration toggled successfully")
                .result(integrationSettingService.toggleIntegration(id))
                .build();
    }
}
