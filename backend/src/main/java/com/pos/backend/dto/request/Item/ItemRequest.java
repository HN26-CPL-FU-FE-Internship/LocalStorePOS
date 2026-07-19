package com.pos.backend.dto.request.Item;

import java.math.BigDecimal;

import org.springframework.web.multipart.MultipartFile;

import com.pos.backend.constant.enums.FoodType;
import com.pos.backend.constant.enums.ItemStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ItemRequest {

    @NotBlank(message = "Item name must not be blank")
    @Size(max = 150, message = "Item name must not exceed 150 characters")
    private String name;

    @NotBlank(message = "Description must not be blank")
    private String description;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be greater than 0")
    private BigDecimal price;

    private BigDecimal netPrice;

    @NotNull(message = "Category is required")
    private Long categoryId;

    private Long taxId;

    private FoodType foodType;

    private ItemStatus status;

    private MultipartFile image;

    /** JSON array of {sizeName, price} */
    private String variations;

    /** JSON array of {name, price, description} */
    private String addons;
}
