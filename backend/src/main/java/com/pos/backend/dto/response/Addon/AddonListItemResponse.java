package com.pos.backend.dto.response.Addon;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AddonListItemResponse {
    private Long id;
    private Long itemId;
    private String itemName;
    private String name;
    private BigDecimal price;
    private String description;
    private String imagePath;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
