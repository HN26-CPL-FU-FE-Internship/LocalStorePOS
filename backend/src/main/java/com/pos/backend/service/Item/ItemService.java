package com.pos.backend.service.Item;

import java.util.List;

import com.pos.backend.constant.enums.FoodType;
import com.pos.backend.constant.enums.ItemStatus;
import com.pos.backend.dto.request.Item.ItemRequest;
import com.pos.backend.dto.response.Common.OptionResponse;
import com.pos.backend.dto.response.Item.ItemDetailResponse;
import com.pos.backend.dto.response.Item.ItemListItemResponse;
import com.pos.backend.service.Common.PageResponse;

public interface ItemService {

    List<OptionResponse> getItemOptions();

    PageResponse<ItemListItemResponse> getItems(
            int page,
            int size,
            String sortBy,
            String sortDir,
            String search,
            Long categoryId,
            FoodType foodType,
            ItemStatus status);

    ItemDetailResponse getItem(Long id);

    ItemDetailResponse createItem(ItemRequest request);

    ItemDetailResponse updateItem(Long id, ItemRequest request);

    ItemDetailResponse updateStatus(Long id, ItemStatus status);

    /**
     * Update only the price of an item (used when a PRICE_CHANGE approval
     * request is approved).
     */
    ItemDetailResponse updatePrice(Long id, java.math.BigDecimal price);

    void deleteItem(Long id);
}
