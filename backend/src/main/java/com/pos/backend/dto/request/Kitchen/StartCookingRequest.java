package com.pos.backend.dto.request.Kitchen;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StartCookingRequest {
    @NotNull
    @Min(value = 1, message = "Minutes must not be less than 1")
    @Max(value = 180, message = "Cooking time cannot exceed 180 minutes")
    private Integer estimatedMinutes;
}
