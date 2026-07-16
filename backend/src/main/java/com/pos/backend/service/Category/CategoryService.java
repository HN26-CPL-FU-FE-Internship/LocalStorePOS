package com.pos.backend.service.Category;
import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.dto.request.Category.CategoryRequest;
import com.pos.backend.dto.response.Category.CategoryListItemResponse;
import com.pos.backend.service.Common.PageResponse;

public interface CategoryService {
    
    PageResponse<CategoryListItemResponse> getCategories(
            int page,
            int size,
            String sortBy,
            String sortDir,
            String search,
            CommonStatus status
    );

    CategoryListItemResponse getCategory(Long id);

    CategoryListItemResponse createCategory(CategoryRequest request);

    CategoryListItemResponse updateCategory(Long id, CategoryRequest request);

    CategoryListItemResponse updateStatus(Long id, CommonStatus status);

    void deleteCategory(Long id);
}
