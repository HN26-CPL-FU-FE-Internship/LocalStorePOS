package com.pos.backend.dto.request.Item;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One row of the "Variations" repeater in the Add/Edit Item modal (e.g. Small / Medium / Large). */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ItemVariationRequest {

    @NotBlank(message = "Variation size name must not be blank")
    private String sizeName;

    @NotNull(message = "Variation price is required")
    private BigDecimal price;
}
