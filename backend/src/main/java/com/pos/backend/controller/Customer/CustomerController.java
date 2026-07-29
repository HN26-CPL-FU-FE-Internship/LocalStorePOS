package com.pos.backend.controller.Customer;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.dto.request.Customer.CustomerRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Common.OptionResponse;
import com.pos.backend.dto.response.Customer.CustomerListItemResponse;
import com.pos.backend.service.Common.PageResponse;
import com.pos.backend.service.Customer.CustomerService;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CustomerController {

    CustomerService customerService;

    @GetMapping("/options")
    public ApiResponse<List<OptionResponse>> getCustomerOptions() {
        return ApiResponse.<List<OptionResponse>>builder()
                .message("Success")
                .result(customerService.getCustomerOptions())
                .build();
    }

    @GetMapping
    public ApiResponse<PageResponse<CustomerListItemResponse>> getCustomers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) CommonStatus status) {

        PageResponse<CustomerListItemResponse> response = customerService.getCustomers(
                page, size, sortBy, sortDir, search, status);

        return ApiResponse.<PageResponse<CustomerListItemResponse>>builder()
                .message("Success")
                .result(response)
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<CustomerListItemResponse> getCustomer(@PathVariable Long id) {
        return ApiResponse.<CustomerListItemResponse>builder()
                .message("Success")
                .result(customerService.getCustomer(id))
                .build();
    }

    @PostMapping(consumes = "multipart/form-data")
    public ApiResponse<CustomerListItemResponse> createCustomer(
            @Valid @ModelAttribute CustomerRequest request) {
        return ApiResponse.<CustomerListItemResponse>builder()
                .message("Customer created successfully")
                .result(customerService.createCustomer(request))
                .build();
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public ApiResponse<CustomerListItemResponse> updateCustomer(
            @PathVariable Long id,
            @Valid @ModelAttribute CustomerRequest request) {
        return ApiResponse.<CustomerListItemResponse>builder()
                .message("Customer updated successfully")
                .result(customerService.updateCustomer(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ApiResponse.<Void>builder()
                .message("Customer deleted successfully")
                .build();
    }
}
