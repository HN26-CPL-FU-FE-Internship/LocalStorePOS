package com.pos.backend.dto.request.Item;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One row of the "Add Ons" repeater in the Add/Edit Item modal. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ItemAddonRequest {

    @NotBlank(message = "Add-on name must not be blank")
    private String name;

    @NotNull(message = "Add-on price is required")
    private BigDecimal price;

    private String description;
}
