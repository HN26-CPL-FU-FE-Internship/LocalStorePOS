package com.pos.backend.controller.OrderItem;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.dto.request.OrderItem.UpdateOrderItemRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.OrderItem.OrderItemResponse;
import com.pos.backend.service.OrderItem.OrderItemService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/api/order-items")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderItemController {

    OrderItemService orderItemService;

    @PatchMapping("/{id}")
    @PreAuthorize("@perm.hasPermission(authentication, 'Kitchen (KDS)', 'edit')")
    public ApiResponse<OrderItemResponse> updateStatus(@PathVariable Long id,
            @RequestBody UpdateOrderItemRequest request) {

        OrderItemResponse response = orderItemService.updateStatus(id, request);
        return ApiResponse.<OrderItemResponse>builder()
                .message("Success")
                .result(response)
                .build();
    }
}
