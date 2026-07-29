package com.pos.backend.controller.Settings;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.dto.request.Settings.TaxSettingRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Common.OptionResponse;
import com.pos.backend.dto.response.Settings.TaxSettingResponse;
import com.pos.backend.service.Settings.TaxSettingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/taxes")
@RequiredArgsConstructor
public class TaxSettingController {

    private final TaxSettingService taxSettingService;

    @GetMapping("/options")
    public ApiResponse<List<OptionResponse>> getTaxOptions() {
        return ApiResponse.<List<OptionResponse>>builder()
                .message("Success")
                .result(taxSettingService.getTaxOptions())
                .build();
    }

    @GetMapping
    @PreAuthorize("@perm.hasPermission(authentication, 'Settings', 'view')")
    public ApiResponse<List<TaxSettingResponse>> getAllTaxes() {
        return ApiResponse.<List<TaxSettingResponse>>builder()
                .message("Success")
                .result(taxSettingService.getAllTaxes())
                .build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("@perm.hasPermission(authentication, 'Settings', 'view')")
    public ApiResponse<TaxSettingResponse> getTax(@PathVariable Long id) {
        return ApiResponse.<TaxSettingResponse>builder()
                .message("Success")
                .result(taxSettingService.getTax(id))
                .build();
    }

    @PostMapping
    @PreAuthorize("@perm.hasPermission(authentication, 'Settings', 'add')")
    public ApiResponse<TaxSettingResponse> createTax(@Valid @RequestBody TaxSettingRequest request) {
        return ApiResponse.<TaxSettingResponse>builder()
                .message("Tax created successfully")
                .result(taxSettingService.createTax(request))
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("@perm.hasPermission(authentication, 'Settings', 'edit')")
    public ApiResponse<TaxSettingResponse> updateTax(
            @PathVariable Long id,
            @Valid @RequestBody TaxSettingRequest request) {
        return ApiResponse.<TaxSettingResponse>builder()
                .message("Tax updated successfully")
                .result(taxSettingService.updateTax(id, request))
                .build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("@perm.hasPermission(authentication, 'Settings', 'edit')")
    public ApiResponse<TaxSettingResponse> updateTaxStatus(
            @PathVariable Long id,
            @RequestParam CommonStatus status) {
        return ApiResponse.<TaxSettingResponse>builder()
                .message("Tax status updated successfully")
                .result(taxSettingService.updateTaxStatus(id, status))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.hasPermission(authentication, 'Settings', 'delete')")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> deleteTax(@PathVariable Long id) {
        taxSettingService.deleteTax(id);
        return ApiResponse.<Void>builder()
                .message("Tax deleted successfully")
                .build();
    }
}
