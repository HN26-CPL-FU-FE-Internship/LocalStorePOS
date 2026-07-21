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
    @Min(value = 1, message = "Không được chọn số phút bé hơn 1")
    @Max(value = 180, message = "Không thể nấu lâu hơn 180 phút")
    private Integer estimatedMinutes;
}
