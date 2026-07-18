package com.pos.backend.service.Category;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.dto.request.Category.CategoryRequest;
import com.pos.backend.dto.response.Category.CategoryListItemResponse;
import com.pos.backend.entity.Category;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.CategoryRepository;
import com.pos.backend.repository.ItemRepository;
import com.pos.backend.service.Common.PageResponse;
import com.pos.backend.util.FileStorageUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private static final String IMAGE_SUB_FOLDER = "categories";

    private final CategoryRepository categoryRepository;
    private final ItemRepository itemRepository;
    private final FileStorageUtil fileStorageUtil;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CategoryListItemResponse> getCategories(
            int page,
            int size,
            String sortBy,
            String sortDir,
            String search,
            CommonStatus status) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page - 1, size, sort);

        String normalizedSearch = (search == null || search.isBlank()) ? null : search.trim();

        Page<Category> categoryPage = categoryRepository.search(normalizedSearch, status, pageable);

        Map<Long, Long> itemCountByCategoryId = countItemsByCategory(categoryPage.getContent());

        List<CategoryListItemResponse> categories = categoryPage.getContent()
                .stream()
                .map(category -> toResponse(category, itemCountByCategoryId.getOrDefault(category.getId(), 0L)))
                .toList();

        return PageResponse.<CategoryListItemResponse>builder()
                .items(categories)
                .page(page)
                .size(size)
                .totalElements(categoryPage.getTotalElements())
                .totalPages(categoryPage.getTotalPages())
                .first(categoryPage.isFirst())
                .last(categoryPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryListItemResponse getCategory(Long id) {
        Category category = findCategoryOrThrow(id);
        long itemCount = itemRepository.countByCategory_Id(id);
        return toResponse(category, itemCount);
    }

    @Override
    @Transactional
    public CategoryListItemResponse createCategory(CategoryRequest request) {
        String name = request.getName().trim();

        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new AppException(ErrorCode.CATEGORY_NAME_ALREADY_EXISTS);
        }

        String imagePath = fileStorageUtil.storeImage(request.getImage(), IMAGE_SUB_FOLDER);

        Category category = Category.builder()
                .name(name)
                .imagePath(imagePath)
                .status(request.getStatus() != null ? request.getStatus() : CommonStatus.active)
                .build();

        category = categoryRepository.save(category);

        return toResponse(category, 0L);
    }

    @Override
    @Transactional
    public CategoryListItemResponse updateCategory(Long id, CategoryRequest request) {
        Category category = findCategoryOrThrow(id);

        String name = request.getName().trim();

        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new AppException(ErrorCode.CATEGORY_NAME_ALREADY_EXISTS);
        }

        category.setName(name);

        if (request.getStatus() != null) {
            category.setStatus(request.getStatus());
        }

        if (request.getImage() != null && !request.getImage().isEmpty()) {
            String oldImagePath = category.getImagePath();
            String newImagePath = fileStorageUtil.storeImage(request.getImage(), IMAGE_SUB_FOLDER);
            category.setImagePath(newImagePath);
            fileStorageUtil.deleteFile(oldImagePath);
        }

        category = categoryRepository.save(category);

        long itemCount = itemRepository.countByCategory_Id(id);

        return toResponse(category, itemCount);
    }

    @Override
    @Transactional
    public CategoryListItemResponse updateStatus(Long id, CommonStatus status) {
        Category category = findCategoryOrThrow(id);
        category.setStatus(status);
        category = categoryRepository.save(category);

        long itemCount = itemRepository.countByCategory_Id(id);

        return toResponse(category, itemCount);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = findCategoryOrThrow(id);

        if (itemRepository.existsByCategory_Id(id)) {
            throw new AppException(ErrorCode.CATEGORY_HAS_ITEMS);
        }

        categoryRepository.delete(category);
        fileStorageUtil.deleteFile(category.getImagePath());
    }

    private Category findCategoryOrThrow(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
    }

    private Map<Long, Long> countItemsByCategory(List<Category> categories) {
        Map<Long, Long> result = new HashMap<>();

        if (categories.isEmpty()) {
            return result;
        }

        List<Long> categoryIds = categories.stream().map(Category::getId).toList();

        for (Object[] row : itemRepository.countByCategoryIds(categoryIds)) {
            Long categoryId = (Long) row[0];
            Long count = (Long) row[1];
            result.put(categoryId, count);
        }

        return result;
    }

    private CategoryListItemResponse toResponse(Category category, long itemCount) {
        return CategoryListItemResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .imagePath(category.getImagePath())
                .itemCount(itemCount)
                .status(category.getStatus().name())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }
}
