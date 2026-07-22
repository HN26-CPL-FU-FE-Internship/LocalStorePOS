package com.pos.backend.dto.response.POS;

import java.math.BigDecimal;
import java.util.List;

import com.pos.backend.dto.response.Item.ItemAddonResponse;
import com.pos.backend.dto.response.Item.ItemVariationResponse;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class POSItemResponse {
    private Long id;
    private String name;
    private String description;
    private String imagePath;
    private BigDecimal price;
    private BigDecimal netPrice;
    private String foodType;
    private Long categoryId;
    private String categoryName;
    private Long taxId;
    private String taxTitle;
    private BigDecimal taxRate;
    private List<ItemVariationResponse> variations;
    private List<ItemAddonResponse> addons;
    /** "trending" | "must_try" | null */
    private String badge;
}
