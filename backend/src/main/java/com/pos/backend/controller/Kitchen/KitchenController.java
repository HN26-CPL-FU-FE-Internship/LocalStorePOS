package com.pos.backend.controller.Kitchen;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Order.OrderResponse;
import com.pos.backend.service.Kitchen.KitchenService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.HashMap;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.pos.backend.dto.request.Kitchen.StartCookingRequest;
import jakarta.validation.Valid;

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
    public ApiResponse<Map<String, Object>> getKitchenOrders(
            @PageableDefault(page = 0, size = 9, sort = "orderedAt", direction = Direction.DESC) Pageable pageable) {
        Page<OrderResponse> page = kitchenService.getKitchenOrders(pageable);

        Map<String, Object> result = new HashMap<>();
        result.put("content", page.getContent());
        result.put("totalElements", page.getTotalElements());
        result.put("totalPages", page.getTotalPages());
        result.put("number", page.getNumber());
        result.put("size", page.getSize());

        return ApiResponse.<Map<String, Object>>builder()
                .message("Success")
                .result(result)
                .build();
    }

    @PostMapping("/{id}/start-cooking")
    public ApiResponse<OrderResponse> startCooking(
            @PathVariable Long id,
            @Valid @RequestBody StartCookingRequest request) {
        OrderResponse response = kitchenService.startCooking(id, request);
        return ApiResponse.<OrderResponse>builder()
                .message("Cooking started successfully")
                .result(response)
                .build();
    }

    @PatchMapping("/{id}/complete")
    public ApiResponse<OrderResponse> markComplete(@PathVariable Long id) {
        OrderResponse response = kitchenService.markComplete(id);
        return ApiResponse.<OrderResponse>builder()
                .message("Order marked as completed")
                .result(response)
                .build();
    }

    @PatchMapping("/{id}/delay")
    public ApiResponse<OrderResponse> markDelayed(@PathVariable Long id) {
        OrderResponse response = kitchenService.markDelayed(id);
        return ApiResponse.<OrderResponse>builder()
                .message("Order is delayed")
                .result(response)
                .build();
    }

}
