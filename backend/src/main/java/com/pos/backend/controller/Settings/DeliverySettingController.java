package com.pos.backend.controller.Settings;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.dto.request.Settings.DeliverySettingRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Settings.DeliverySettingResponse;
import com.pos.backend.service.Settings.DeliverySettingServiceImpl;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/delivery-settings")
@RequiredArgsConstructor
public class DeliverySettingController {

    private final DeliverySettingServiceImpl deliverySettingService;

    @GetMapping("/current")
    public ApiResponse<DeliverySettingResponse> getDeliverySetting() {
        return ApiResponse.<DeliverySettingResponse>builder()
                .message("Success")
                .result(deliverySettingService.getDeliverySetting())
                .build();
    }

    @PutMapping("/current")
    public ApiResponse<DeliverySettingResponse> updateDeliverySetting(@RequestBody DeliverySettingRequest request) {
        return ApiResponse.<DeliverySettingResponse>builder()
                .message("Delivery settings updated successfully")
                .result(deliverySettingService.updateDeliverySetting(request))
                .build();
    }
}
