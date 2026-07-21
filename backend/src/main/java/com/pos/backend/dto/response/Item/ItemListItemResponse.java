package com.pos.backend.dto.response.Item;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ItemListItemResponse {
    private Long id;
    private String name;
    private String imagePath;
    private BigDecimal price;
    private BigDecimal netPrice;
    private String foodType;
    private String status;
    private Long categoryId;
    private String categoryName;
    private Long taxId;
    private String taxTitle;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
