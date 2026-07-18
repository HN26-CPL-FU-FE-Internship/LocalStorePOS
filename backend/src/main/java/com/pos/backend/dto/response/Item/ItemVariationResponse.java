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
public class ItemVariationResponse {
    private Long id;
    private String sizeName;
    private BigDecimal price;
}
