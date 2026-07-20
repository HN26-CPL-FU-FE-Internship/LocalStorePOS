package com.pos.backend.controller.Kitchen;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.service.Kitchen.KitchenService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;


@RestController
@RequestMapping("/api/kitchen")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class KitchenController {
    
    KitchenService kitchenService;

    @GetMapping("/stats")
    public ApiResponse<Map<String, Long>> getKitchenStats() {
        
        Map<String, Long> responses = kitchenService.getKitchenStats();

        return ApiResponse.<Map<String, Long>>builder()
        .message("Success")
        .result(responses)
        .build();
    }
    
}
