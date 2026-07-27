package com.pos.backend.controller.Settings;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.dto.request.Settings.PrintSettingRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Settings.PrintSettingResponse;
import com.pos.backend.service.Settings.PrintSettingServiceImpl;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/print-settings")
@RequiredArgsConstructor
public class PrintSettingController {

    private final PrintSettingServiceImpl printSettingService;

    @GetMapping("/current")
    public ApiResponse<PrintSettingResponse> getPrintSetting() {
        return ApiResponse.<PrintSettingResponse>builder()
                .message("Success")
                .result(printSettingService.getPrintSetting())
                .build();
    }

    @PutMapping("/current")
    public ApiResponse<PrintSettingResponse> updatePrintSetting(@RequestBody PrintSettingRequest request) {
        return ApiResponse.<PrintSettingResponse>builder()
                .message("Print settings updated successfully")
                .result(printSettingService.updatePrintSetting(request))
                .build();
    }
}
