package com.pos.backend.controller.Order;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.dto.request.Filter.DateFilter;
import com.pos.backend.dto.request.Filter.OrderFilter;
import com.pos.backend.dto.request.Order.OrderUpdateStatusRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Order.OrderResponse;
import com.pos.backend.service.Order.OrderService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;

import com.pos.backend.dto.request.Order.OrderPaymentRequest;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/api/orders")
public class OrderController {

        OrderService orderService;

        @GetMapping("/stats")
        public ApiResponse<Map<String, Long>> getCountOrderByStatus(DateFilter filter) {
                return ApiResponse.<Map<String, Long>>builder()
                                .result(orderService.getOrderCountByStatus(filter))
                                .build();
        }

        @GetMapping("/order-list")
        public ApiResponse<Page<OrderResponse>> getListOrders(
                        @PageableDefault(page = 0, size = 10, sort = "orderedAt", direction = Direction.DESC) Pageable pageable,
                        OrderFilter filter

        ) {
                Page<OrderResponse> responses = orderService.getListOrders(pageable, filter);
                return ApiResponse.<Page<OrderResponse>>builder()
                                .result(responses)
                                .build();
        }

        @PatchMapping("/{id}/status")
        public ApiResponse<OrderResponse> updateStatus(@PathVariable Long id,
                        @RequestBody OrderUpdateStatusRequest request) {

                OrderResponse response = orderService.updateStatus(request, id);

                return ApiResponse.<OrderResponse>builder()
                                .message("Updated status successfully")
                                .result(response)
                                .build();
        }

        @PostMapping("/{id}/pay")
        public ApiResponse<OrderResponse> payOrder(@PathVariable Long id,
                        @RequestBody OrderPaymentRequest request) {

                OrderResponse response = orderService.processPayment(request, id);

                return ApiResponse.<OrderResponse>builder()
                                .message("Payment processed successfully")
                                .result(response)
                                .build();
        }

        @GetMapping("/{orderNumber}/detail")
        // @PreAuthorize("@perm.hasPermission(authentication)")
        public ApiResponse<OrderResponse> getByOrderNumber(@PathVariable String orderNumber) {

                OrderResponse response = orderService.getOrderDetail(orderNumber);
                return ApiResponse.<OrderResponse>builder()
                                .message("Success")
                                .result(response)
                                .build();
        }

}
