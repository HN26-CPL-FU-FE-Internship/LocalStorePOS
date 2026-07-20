package com.pos.backend.controller.Kitchen;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Order.OrderResponse;
import com.pos.backend.service.Kitchen.KitchenService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.web.PageableDefault;
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
    
    @GetMapping("/orders")
    public ApiResponse<List<OrderResponse>> getKitchenOrders(@PageableDefault(page = 0, size = 100, sort = "orderedAt", direction = Direction.DESC) Pageable pageable){
        List<OrderResponse> responses = kitchenService.getKitchenOrders(pageable);
        return ApiResponse.<List<OrderResponse>>builder()
        .message("Success")
        .result(responses)
        .build();
    }
    
}
