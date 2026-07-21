package com.pos.backend.dto.response.Item;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ItemDetailResponse {
    private Long id;
    private String name;
    private String description;
    private String imagePath;
    private BigDecimal price;
    private BigDecimal netPrice;
    private String foodType;
    private String status;
    private Long categoryId;
    private String categoryName;
    private Long taxId;
    private String taxTitle;
    private List<ItemVariationResponse> variations;
    private List<ItemAddonResponse> addons;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
