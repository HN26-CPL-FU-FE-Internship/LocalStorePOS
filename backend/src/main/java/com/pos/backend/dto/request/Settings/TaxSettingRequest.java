package com.pos.backend.dto.request.Settings;

import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.constant.enums.TaxType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaxSettingRequest {

    @NotBlank(message = "Tax title must not be blank")
    @Size(max = 100)
    String title;

    @NotNull(message = "Tax rate is required")
    @Positive(message = "Tax rate must be positive")
    Double taxRate;

    @NotNull(message = "Tax type is required")
    TaxType taxType;

    CommonStatus status;
}
