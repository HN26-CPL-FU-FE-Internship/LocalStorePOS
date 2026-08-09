package com.pos.backend.service.Item;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.AuditAction;
import com.pos.backend.constant.enums.FoodType;
import com.pos.backend.constant.enums.ItemStatus;
import com.pos.backend.dto.request.Item.ItemAddonRequest;
import com.pos.backend.dto.request.Item.ItemRequest;
import com.pos.backend.dto.request.Item.ItemVariationRequest;
import com.pos.backend.dto.response.Common.OptionResponse;
import com.pos.backend.dto.response.Item.ItemAddonResponse;
import com.pos.backend.dto.response.Item.ItemDetailResponse;
import com.pos.backend.dto.response.Item.ItemListItemResponse;
import com.pos.backend.dto.response.Item.ItemVariationResponse;
import com.pos.backend.entity.Addon;
import com.pos.backend.entity.Category;
import com.pos.backend.entity.Item;
import com.pos.backend.entity.ItemVariation;
import com.pos.backend.entity.Tax;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.AddonRepository;
import com.pos.backend.repository.CategoryRepository;
import com.pos.backend.repository.ItemRepository;
import com.pos.backend.repository.ItemVariationRepository;
import com.pos.backend.repository.TaxRepository;
import com.pos.backend.service.Common.PageResponse;
import com.pos.backend.service.Audit.AuditLogService;
import com.pos.backend.util.FileStorageUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ItemServiceImpl implements ItemService {

    private final AuditLogService auditLogService;

    private static final String IMAGE_SUB_FOLDER = "items";

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final TaxRepository taxRepository;
    private final ItemVariationRepository itemVariationRepository;
    private final AddonRepository addonRepository;
    private final FileStorageUtil fileStorageUtil;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public List<OptionResponse> getItemOptions() {
        return itemRepository.findAll().stream()
                .map(item -> OptionResponse.builder()
                        .id(item.getId())
                        .name(item.getName())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ItemListItemResponse> getItems(
            int page,
            int size,
            String sortBy,
            String sortDir,
            String search,
            Long categoryId,
            FoodType foodType,
            ItemStatus status) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page - 1, size, sort);

        String normalizedSearch = (search == null || search.isBlank()) ? null : search.trim();

        Page<Item> itemPage = itemRepository.search(normalizedSearch, categoryId, foodType, status, pageable);

        List<ItemListItemResponse> items = itemPage.getContent().stream().map(this::toListResponse).toList();

        return PageResponse.<ItemListItemResponse>builder()
                .items(items)
                .page(page)
                .size(size)
                .totalElements(itemPage.getTotalElements())
                .totalPages(itemPage.getTotalPages())
                .first(itemPage.isFirst())
                .last(itemPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ItemDetailResponse getItem(Long id) {
        Item item = findItemOrThrow(id);
        return toDetailResponse(item);
    }

    @Override
    @Transactional
    public ItemDetailResponse createItem(ItemRequest request) {
        Category category = findCategoryOrThrow(request.getCategoryId());
        Tax tax = findTaxOrNull(request.getTaxId());

        String imagePath = fileStorageUtil.storeImage(request.getImage(), IMAGE_SUB_FOLDER);

        Item item = Item.builder()
                .category(category)
                .tax(tax)
                .name(request.getName().trim())
                .description(request.getDescription())
                .imagePath(imagePath)
                .price(request.getPrice())
                .netPrice(request.getNetPrice())
                .foodType(request.getFoodType() != null ? request.getFoodType() : FoodType.veg)
                .status(request.getStatus() != null ? request.getStatus() : ItemStatus.active)
                .build();

        item = itemRepository.save(item);
        replaceVariations(item, request.getVariations());
        replaceAddons(item, request.getAddons());

        auditLogService.log(null, AuditAction.ITEM_CREATED, "MENU_PRICE", "Item", item.getId(),
                "Item created: " + item.getName() + " ($" + item.getPrice() + ")",
                null, null, "SUCCESS", null);

        return toDetailResponse(item);
    }

    @Override
    @Transactional
    public ItemDetailResponse updateItem(Long id, ItemRequest request) {
        Item item = findItemOrThrow(id);
        Category category = findCategoryOrThrow(request.getCategoryId());
        Tax tax = findTaxOrNull(request.getTaxId());

        item.setCategory(category);
        item.setTax(tax);
        item.setName(request.getName().trim());
        item.setDescription(request.getDescription());
        item.setPrice(request.getPrice());
        item.setNetPrice(request.getNetPrice());

        if (request.getFoodType() != null) {
            item.setFoodType(request.getFoodType());
        }
        if (request.getStatus() != null) {
            item.setStatus(request.getStatus());
        }

        if (request.getImage() != null && !request.getImage().isEmpty()) {
            String oldImagePath = item.getImagePath();
            String newImagePath = fileStorageUtil.storeImage(request.getImage(), IMAGE_SUB_FOLDER);
            item.setImagePath(newImagePath);
            fileStorageUtil.deleteFile(oldImagePath);
        }

        item = itemRepository.save(item);

        if (request.getVariations() != null) {
            replaceVariations(item, request.getVariations());
        }
        if (request.getAddons() != null) {
            replaceAddons(item, request.getAddons());
        }

        ItemDetailResponse response = toDetailResponse(item);

        auditLogService.log(null, AuditAction.ITEM_UPDATED, "MENU_PRICE", "Item", id,
                "Item updated: " + item.getName(), null, null, "SUCCESS", null);

        return response;
    }

    @Override
    @Transactional
    public ItemDetailResponse updateStatus(Long id, ItemStatus status) {
        Item item = findItemOrThrow(id);
        item.setStatus(status);
        ItemDetailResponse statusResponse = toDetailResponse(itemRepository.save(item));

        auditLogService.log(null, AuditAction.ITEM_UPDATED, "MENU_PRICE", "Item", id,
                "Item status changed to " + status.name() + ": " + item.getName(),
                null, null, "SUCCESS", null);

        return statusResponse;
    }

    @Override
    @Transactional
    public ItemDetailResponse updatePrice(Long id, java.math.BigDecimal price) {
        Item item = findItemOrThrow(id);
        item.setPrice(price);
        ItemDetailResponse response = toDetailResponse(itemRepository.save(item));

        auditLogService.log(null, AuditAction.MENU_PRICE_UPDATED, "MENU_PRICE", "Item", id,
                "Item price changed to $" + price + ": " + item.getName(),
                null, null, "SUCCESS", null);

        return response;
    }

    @Override
    @Transactional
    public void deleteItem(Long id) {
        Item item = findItemOrThrow(id);
        itemRepository.delete(item);
        fileStorageUtil.deleteFile(item.getImagePath());

        auditLogService.log(null, AuditAction.ITEM_DELETED, "MENU_PRICE", "Item", id,
                "Item deleted: " + item.getName(), null, null, "SUCCESS", null);
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                            */
    /* ------------------------------------------------------------------ */

    private Item findItemOrThrow(Long id) {
        return itemRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.ITEM_NOT_FOUND));
    }

    private Category findCategoryOrThrow(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
    }

    private Tax findTaxOrNull(Long taxId) {
        if (taxId == null) {
            return null;
        }
        return taxRepository.findById(taxId).orElseThrow(() -> new AppException(ErrorCode.TAX_NOT_FOUND));
    }

    private void replaceVariations(Item item, String variationsJson) {
        itemVariationRepository.deleteByItem_Id(item.getId());

        List<ItemVariationRequest> parsed = parseJsonArray(variationsJson, new TypeReference<>() {});

        if (parsed.isEmpty()) {
            return;
        }

        List<ItemVariation> entities = parsed.stream()
                .<ItemVariation>map(v -> ItemVariation.builder()
                        .item(item)
                        .sizeName(v.getSizeName().trim())
                        .price(v.getPrice())
                        .build())
                .toList();

        itemVariationRepository.saveAll(entities);
    }

    private void replaceAddons(Item item, String addonsJson) {
        addonRepository.deleteByItem_Id(item.getId());

        List<ItemAddonRequest> parsed = parseJsonArray(addonsJson, new TypeReference<>() {});

        if (parsed.isEmpty()) {
            return;
        }

        List<Addon> entities = parsed.stream()
                .<Addon>map(a -> Addon.builder()
                        .item(item)
                        .name(a.getName().trim())
                        .price(a.getPrice())
                        .description(a.getDescription())
                        .build())
                .toList();

        addonRepository.saveAll(entities);
    }

    private <T> List<T> parseJsonArray(String json, TypeReference<List<T>> typeReference) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, typeReference);
        } catch (Exception e) {
            throw new AppException(ErrorCode.INVALID_VARIATION_OR_ADDON_DATA);
        }
    }

    private ItemListItemResponse toListResponse(Item item) {
        return ItemListItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .imagePath(item.getImagePath())
                .price(item.getPrice())
                .netPrice(item.getNetPrice())
                .foodType(item.getFoodType().name())
                .status(item.getStatus().name())
                .categoryId(item.getCategory().getId())
                .categoryName(item.getCategory().getName())
                .taxId(item.getTax() != null ? item.getTax().getId() : null)
                .taxTitle(item.getTax() != null ? item.getTax().getTitle() : null)
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    private ItemDetailResponse toDetailResponse(Item item) {
        List<ItemVariationResponse> variations = itemVariationRepository
                .findByItem_IdOrderByIdAsc(item.getId())
                .stream()
                .map(v -> ItemVariationResponse.builder()
                        .id(v.getId())
                        .sizeName(v.getSizeName())
                        .price(v.getPrice())
                        .build())
                .toList();

        List<ItemAddonResponse> addons = addonRepository.findByItem_IdOrderByIdAsc(item.getId())
                .stream()
                .map(a -> ItemAddonResponse.builder()
                        .id(a.getId())
                        .name(a.getName())
                        .price(a.getPrice())
                        .description(a.getDescription())
                        .build())
                .toList();

        return ItemDetailResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .description(item.getDescription())
                .imagePath(item.getImagePath())
                .price(item.getPrice())
                .netPrice(item.getNetPrice())
                .foodType(item.getFoodType().name())
                .status(item.getStatus().name())
                .categoryId(item.getCategory().getId())
                .categoryName(item.getCategory().getName())
                .taxId(item.getTax() != null ? item.getTax().getId() : null)
                .taxTitle(item.getTax() != null ? item.getTax().getTitle() : null)
                .variations(variations)
                .addons(addons)
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
