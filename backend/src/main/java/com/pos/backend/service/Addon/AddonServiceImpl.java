package com.pos.backend.service.Addon;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.dto.request.Addon.AddonRequest;
import com.pos.backend.dto.response.Addon.AddonListItemResponse;
import com.pos.backend.entity.Addon;
import com.pos.backend.entity.Item;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.AddonRepository;
import com.pos.backend.repository.ItemRepository;
import com.pos.backend.service.Common.PageResponse;
import com.pos.backend.util.FileStorageUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AddonServiceImpl implements AddonService {

    private static final String IMAGE_SUB_FOLDER = "addons";

    private final AddonRepository addonRepository;
    private final ItemRepository itemRepository;
    private final FileStorageUtil fileStorageUtil;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AddonListItemResponse> getAddons(
            int page,
            int size,
            String sortBy,
            String sortDir,
            String search,
            Long itemId,
            CommonStatus status) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page - 1, size, sort);

        String normalizedSearch = (search == null || search.isBlank()) ? null : search.trim();

        Page<Addon> addonPage = addonRepository.search(normalizedSearch, itemId, status, pageable);

        List<AddonListItemResponse> addons = addonPage.getContent().stream().map(this::toResponse).toList();

        return PageResponse.<AddonListItemResponse>builder()
                .items(addons)
                .page(page)
                .size(size)
                .totalElements(addonPage.getTotalElements())
                .totalPages(addonPage.getTotalPages())
                .first(addonPage.isFirst())
                .last(addonPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AddonListItemResponse getAddon(Long id) {
        return toResponse(findAddonOrThrow(id));
    }

    @Override
    @Transactional
    public AddonListItemResponse createAddon(AddonRequest request) {
        Item item = findItemOrThrow(request.getItemId());

        String imagePath = fileStorageUtil.storeImage(request.getImage(), IMAGE_SUB_FOLDER);

        Addon addon = Addon.builder()
                .item(item)
                .name(request.getName().trim())
                .price(request.getPrice())
                .description(request.getDescription())
                .imagePath(imagePath)
                .status(request.getStatus() != null ? request.getStatus() : CommonStatus.active)
                .build();

        addon = addonRepository.save(addon);

        return toResponse(addon);
    }

    @Override
    @Transactional
    public AddonListItemResponse updateAddon(Long id, AddonRequest request) {
        Addon addon = findAddonOrThrow(id);
        Item item = findItemOrThrow(request.getItemId());

        addon.setItem(item);
        addon.setName(request.getName().trim());
        addon.setPrice(request.getPrice());
        addon.setDescription(request.getDescription());

        if (request.getStatus() != null) {
            addon.setStatus(request.getStatus());
        }

        if (request.getImage() != null && !request.getImage().isEmpty()) {
            String oldImagePath = addon.getImagePath();
            String newImagePath = fileStorageUtil.storeImage(request.getImage(), IMAGE_SUB_FOLDER);
            addon.setImagePath(newImagePath);
            fileStorageUtil.deleteFile(oldImagePath);
        }

        addon = addonRepository.save(addon);

        return toResponse(addon);
    }

    @Override
    @Transactional
    public AddonListItemResponse updateStatus(Long id, CommonStatus status) {
        Addon addon = findAddonOrThrow(id);
        addon.setStatus(status);
        addon = addonRepository.save(addon);
        return toResponse(addon);
    }

    @Override
    @Transactional
    public void deleteAddon(Long id) {
        Addon addon = findAddonOrThrow(id);
        addonRepository.delete(addon);
        fileStorageUtil.deleteFile(addon.getImagePath());
    }

    private Addon findAddonOrThrow(Long id) {
        return addonRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.ADDON_NOT_FOUND));
    }

    private Item findItemOrThrow(Long itemId) {
        return itemRepository.findById(itemId).orElseThrow(() -> new AppException(ErrorCode.ITEM_NOT_FOUND));
    }

    private AddonListItemResponse toResponse(Addon addon) {
        return AddonListItemResponse.builder()
                .id(addon.getId())
                .itemId(addon.getItem().getId())
                .itemName(addon.getItem().getName())
                .name(addon.getName())
                .price(addon.getPrice())
                .description(addon.getDescription())
                .imagePath(addon.getImagePath())
                .status(addon.getStatus().name())
                .createdAt(addon.getCreatedAt())
                .updatedAt(addon.getUpdatedAt())
                .build();
    }
}
