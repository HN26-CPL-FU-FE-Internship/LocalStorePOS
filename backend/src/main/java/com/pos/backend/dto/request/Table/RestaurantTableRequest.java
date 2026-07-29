package com.pos.backend.dto.request.Table;

import com.pos.backend.constant.enums.TableStatus;

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
public class RestaurantTableRequest {

    @NotBlank(message = "Table name must not be blank")
    @Size(max = 20, message = "Table name must not exceed 20 characters")
    private String tableNumber;

    @NotNull(message = "Area is required")
    private Long areaId;

    @NotNull(message = "Seats is required")
    @Positive(message = "Seats must be greater than 0")
    private Integer seats;

    private TableStatus status;
}
