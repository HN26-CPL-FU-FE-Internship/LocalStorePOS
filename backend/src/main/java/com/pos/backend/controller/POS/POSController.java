package com.pos.backend.controller.POS;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.dto.request.POS.CreateCustomerRequest;
import com.pos.backend.dto.request.POS.CreateOrderRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Common.OptionResponse;
import com.pos.backend.dto.response.Order.OrderResponse;
import com.pos.backend.dto.response.POS.POSItemResponse;
import com.pos.backend.entity.Customer;
import com.pos.backend.service.POS.POSService;

import jakarta.validation.Valid;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/api/pos")
public class POSController {

    POSService posService;

    @GetMapping("/recent-orders")
    // @PreAuthorize("@perm.hasPermission(authentication)")
    public ApiResponse<Page<OrderResponse>> getRecentOrders(
            @PageableDefault(size = 20, sort = "orderedAt", direction = Direction.DESC) Pageable pageable) {

        Page<OrderResponse> responses = posService.getListRecentOrder(pageable);
        return ApiResponse.<Page<OrderResponse>>builder()
                .message("Success")
                .result(responses)
                .build();
    }

    @GetMapping("/items")
    public ApiResponse<List<POSItemResponse>> getItemsByCategory(
            @RequestParam(required = false, defaultValue = "0") Long categoryId) {

        List<POSItemResponse> items = posService.getItemsByCategory(categoryId);
        return ApiResponse.<List<POSItemResponse>>builder()
                .message("Success")
                .result(items)
                .build();
    }

    @GetMapping("/tables")
    public ApiResponse<List<OptionResponse>> getAvailableTables() {
        return ApiResponse.<List<OptionResponse>>builder()
                .message("Success")
                .result(posService.getAvailableTables())
                .build();
    }

    @GetMapping("/waiters")
    public ApiResponse<List<OptionResponse>> getWaiters() {
        return ApiResponse.<List<OptionResponse>>builder()
                .message("Success")
                .result(posService.getWaiters())
                .build();
    }

    @GetMapping("/customers")
    public ApiResponse<List<OptionResponse>> getCustomers() {
        return ApiResponse.<List<OptionResponse>>builder()
                .message("Success")
                .result(posService.getCustomers())
                .build();
    }

    @PostMapping("/customers")
    public ApiResponse<OptionResponse> createCustomer(
            @Valid @RequestBody CreateCustomerRequest request) {

        Customer customer = posService.createCustomer(request);
        OptionResponse response = OptionResponse.builder()
                .id(customer.getId())
                .name(customer.getName())
                .build();

        return ApiResponse.<OptionResponse>builder()
                .message("Customer created successfully")
                .result(response)
                .build();
    }

    @PostMapping("/orders")
    public ApiResponse<OrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request) {

        OrderResponse response = posService.createOrder(request);
        return ApiResponse.<OrderResponse>builder()
                .message("Order placed successfully")
                .result(response)
                .build();
    }
}
