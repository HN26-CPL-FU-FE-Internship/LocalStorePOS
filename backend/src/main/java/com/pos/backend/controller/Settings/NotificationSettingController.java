package com.pos.backend.controller.Settings;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.dto.request.Settings.NotificationSettingRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Settings.NotificationSettingResponse;
import com.pos.backend.service.Settings.NotificationSettingServiceImpl;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notification-settings")
@RequiredArgsConstructor
public class NotificationSettingController {

    private final NotificationSettingServiceImpl notificationSettingService;

    @GetMapping("/current")
    public ApiResponse<NotificationSettingResponse> getNotificationSetting() {
        return ApiResponse.<NotificationSettingResponse>builder()
                .message("Success")
                .result(notificationSettingService.getNotificationSetting())
                .build();
    }

    @PutMapping("/current")
    public ApiResponse<NotificationSettingResponse> updateNotificationSetting(@RequestBody NotificationSettingRequest request) {
        return ApiResponse.<NotificationSettingResponse>builder()
                .message("Notification settings updated successfully")
                .result(notificationSettingService.updateNotificationSetting(request))
                .build();
    }
}
