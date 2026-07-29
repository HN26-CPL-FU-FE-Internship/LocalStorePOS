package com.pos.backend.controller.Settings;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.dto.request.Settings.StoreSettingRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Settings.StoreSettingResponse;
import com.pos.backend.service.Settings.SettingsService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreSettingController {

    private final SettingsService settingsService;

    @GetMapping("/current")
    public ApiResponse<StoreSettingResponse> getStoreSetting() {
        return ApiResponse.<StoreSettingResponse>builder()
                .message("Success")
                .result(settingsService.getStoreSetting())
                .build();
    }

    @PutMapping(value = "/current", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<StoreSettingResponse> updateStoreSetting(
            @Valid @ModelAttribute StoreSettingRequest request) {
        return ApiResponse.<StoreSettingResponse>builder()
                .message("Store settings updated successfully")
                .result(settingsService.updateStoreSetting(request))
                .build();
    }
}
