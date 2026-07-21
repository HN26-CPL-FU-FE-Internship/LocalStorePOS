package com.pos.backend.controller.Addon;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.dto.request.Addon.AddonRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Addon.AddonListItemResponse;
import com.pos.backend.service.Addon.AddonService;
import com.pos.backend.service.Common.PageResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/addons")
@RequiredArgsConstructor
public class AddonController {

    private final AddonService addonService;

    @GetMapping
    public ApiResponse<PageResponse<AddonListItemResponse>> getAddons(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long itemId,
            @RequestParam(required = false) CommonStatus status) {

        PageResponse<AddonListItemResponse> response = addonService.getAddons(
                page, size, sortBy, sortDir, search, itemId, status);

        return ApiResponse.<PageResponse<AddonListItemResponse>>builder()
                .message("Success")
                .result(response)
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<AddonListItemResponse> getAddon(@PathVariable Long id) {
        return ApiResponse.<AddonListItemResponse>builder()
                .message("Success")
                .result(addonService.getAddon(id))
                .build();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<AddonListItemResponse> createAddon(@Valid @ModelAttribute AddonRequest request) {
        return ApiResponse.<AddonListItemResponse>builder()
                .message("Addon created successfully")
                .result(addonService.createAddon(request))
                .build();
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<AddonListItemResponse> updateAddon(
            @PathVariable Long id,
            @Valid @ModelAttribute AddonRequest request) {

        return ApiResponse.<AddonListItemResponse>builder()
                .message("Addon updated successfully")
                .result(addonService.updateAddon(id, request))
                .build();
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<AddonListItemResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam CommonStatus status) {

        return ApiResponse.<AddonListItemResponse>builder()
                .message("Addon status updated successfully")
                .result(addonService.updateStatus(id, status))
                .build();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> deleteAddon(@PathVariable Long id) {
        addonService.deleteAddon(id);

        return ApiResponse.<Void>builder()
                .message("Addon deleted successfully")
                .build();
    }
}
