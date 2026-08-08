package com.pos.backend.dto.request.Table;

import com.fasterxml.jackson.annotation.JsonProperty;

import com.pos.backend.constant.enums.TableStatus;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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

    /** X coordinate of the table centre on the floor map (grid 0-1000). */
    @JsonProperty("xPosition")
    @Min(value = 0, message = "Position X must be between 0 and 1000")
    @Max(value = 1000, message = "Position X must be between 0 and 1000")
    private Integer xPosition;

    /** Y coordinate of the table centre on the floor map (grid 0-640). */
    @JsonProperty("yPosition")
    @Min(value = 0, message = "Position Y must be between 0 and 640")
    @Max(value = 640, message = "Position Y must be between 0 and 640")
    private Integer yPosition;

    /** Table shape on the map: ROUND | RECTANGLE. */
    @Size(max = 20, message = "Shape must not exceed 20 characters")
    private String shape;
}
