package com.pos.backend.controller.Item;

import java.util.List;

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

import com.pos.backend.constant.enums.FoodType;
import com.pos.backend.constant.enums.ItemStatus;
import com.pos.backend.dto.request.Item.ItemRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Common.OptionResponse;
import com.pos.backend.dto.response.Item.ItemDetailResponse;
import com.pos.backend.dto.response.Item.ItemListItemResponse;
import com.pos.backend.service.Common.PageResponse;
import com.pos.backend.service.Item.ItemService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

        private final ItemService itemService;

        @GetMapping("/options")
        public ApiResponse<List<OptionResponse>> getItemOptions() {
                return ApiResponse.<List<OptionResponse>>builder()
                                .message("Success")
                                .result(itemService.getItemOptions())
                                .build();
        }

        @GetMapping
        public ApiResponse<PageResponse<ItemListItemResponse>> getItems(
                        @RequestParam(defaultValue = "1") int page,
                        @RequestParam(defaultValue = "12") int size,
                        @RequestParam(defaultValue = "createdAt") String sortBy,
                        @RequestParam(defaultValue = "desc") String sortDir,
                        @RequestParam(required = false) String search,
                        @RequestParam(required = false) Long categoryId,
                        @RequestParam(required = false) FoodType foodType,
                        @RequestParam(required = false) ItemStatus status) {

                PageResponse<ItemListItemResponse> response = itemService.getItems(
                                page, size, sortBy, sortDir, search, categoryId, foodType, status);

                return ApiResponse.<PageResponse<ItemListItemResponse>>builder()
                                .message("Success")
                                .result(response)
                                .build();
        }

        @GetMapping("/{id}")
        public ApiResponse<ItemDetailResponse> getItem(@PathVariable Long id) {
                return ApiResponse.<ItemDetailResponse>builder()
                                .message("Success")
                                .result(itemService.getItem(id))
                                .build();
        }

        @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ApiResponse<ItemDetailResponse> createItem(@Valid @ModelAttribute ItemRequest request) {
                return ApiResponse.<ItemDetailResponse>builder()
                                .message("Item created successfully")
                                .result(itemService.createItem(request))
                                .build();
        }

        @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ApiResponse<ItemDetailResponse> updateItem(
                        @PathVariable Long id,
                        @Valid @ModelAttribute ItemRequest request) {

                return ApiResponse.<ItemDetailResponse>builder()
                                .message("Item updated successfully")
                                .result(itemService.updateItem(id, request))
                                .build();
        }

        @PatchMapping("/{id}/status")
        public ApiResponse<ItemDetailResponse> updateStatus(
                        @PathVariable Long id,
                        @RequestParam ItemStatus status) {

                return ApiResponse.<ItemDetailResponse>builder()
                                .message("Item status updated successfully")
                                .result(itemService.updateStatus(id, status))
                                .build();
        }

        @DeleteMapping("/{id}")
        @ResponseStatus(HttpStatus.OK)
        public ApiResponse<Void> deleteItem(@PathVariable Long id) {
                itemService.deleteItem(id);

                return ApiResponse.<Void>builder()
                                .message("Item deleted successfully")
                                .build();
        }
}
