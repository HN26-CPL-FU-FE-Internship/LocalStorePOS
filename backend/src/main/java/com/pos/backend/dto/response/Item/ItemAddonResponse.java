package com.pos.backend.dto.response.Item;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemAddonResponse {
    private Long id;
    private String name;
    private BigDecimal price;
    private String description;

    @Builder.Default
    private Integer quantity = 0;
}
