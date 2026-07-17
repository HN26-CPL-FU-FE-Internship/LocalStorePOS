package com.pos.backend.controller.Category;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
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
import com.pos.backend.dto.request.Category.CategoryRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Category.CategoryListItemResponse;
import com.pos.backend.service.Category.CategoryService;
import com.pos.backend.service.Common.PageResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @PreAuthorize("@perm.hasPermission(authentication, 'Categories', 'view')")
    public ApiResponse<PageResponse<CategoryListItemResponse>> getCategories(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) CommonStatus status) {

        PageResponse<CategoryListItemResponse> response = categoryService.getCategories(
                page, size, sortBy, sortDir, search, status);

        return ApiResponse.<PageResponse<CategoryListItemResponse>>builder()
                .message("Success")
                .result(response)
                .build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("@perm.hasPermission(authentication, 'Categories', 'view')")
    public ApiResponse<CategoryListItemResponse> getCategory(@PathVariable Long id) {
        return ApiResponse.<CategoryListItemResponse>builder()
                .message("Success")
                .result(categoryService.getCategory(id))
                .build();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@perm.hasPermission(authentication, 'Categories', 'add')")
    public ApiResponse<CategoryListItemResponse> createCategory(@Valid @ModelAttribute CategoryRequest request) {
        return ApiResponse.<CategoryListItemResponse>builder()
                .message("Category created successfully")
                .result(categoryService.createCategory(request))
                .build();
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@perm.hasPermission(authentication, 'Categories', 'edit')")
    public ApiResponse<CategoryListItemResponse> updateCategory(
            @PathVariable Long id,
            @Valid @ModelAttribute CategoryRequest request) {

        return ApiResponse.<CategoryListItemResponse>builder()
                .message("Category updated successfully")
                .result(categoryService.updateCategory(id, request))
                .build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("@perm.hasPermission(authentication, 'Categories', 'edit')")
    public ApiResponse<CategoryListItemResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam CommonStatus status) {

        return ApiResponse.<CategoryListItemResponse>builder()
                .message("Category status updated successfully")
                .result(categoryService.updateStatus(id, status))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.hasPermission(authentication, 'Categories', 'delete')")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);

        return ApiResponse.<Void>builder()
                .message("Category deleted successfully")
                .build();
    }
}
