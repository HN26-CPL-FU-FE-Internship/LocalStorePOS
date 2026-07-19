package com.pos.backend.dto.request.Addon;

import java.math.BigDecimal;

import org.springframework.web.multipart.MultipartFile;

import com.pos.backend.constant.enums.CommonStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Bound from the multipart/form-data body of the Add/Edit Addon modal. */
@Getter
@Setter
@NoArgsConstructor
public class AddonRequest {

    @NotNull(message = "Item is required")
    private Long itemId;

    @NotBlank(message = "Addon name must not be blank")
    @Size(max = 150, message = "Addon name must not exceed 150 characters")
    private String name;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be greater than 0")
    private BigDecimal price;

    @NotBlank(message = "Description must not be blank")
    private String description;

    private CommonStatus status;

    private MultipartFile image;
}
