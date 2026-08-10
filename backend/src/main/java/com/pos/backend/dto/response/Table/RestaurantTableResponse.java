package com.pos.backend.dto.response.Table;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RestaurantTableResponse {
    private Long id;
    private String tableNumber;
    private Long floorId;
    private String floorName;
    private Long areaId;
    private String areaName;
    private Integer seats;
    private String status;
    @JsonProperty("xPosition")
    private Integer xPosition;
    @JsonProperty("yPosition")
    private Integer yPosition;
    private String shape;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Explicit getter keeps Jackson's implicit bean name ("xposition") from
     * being emitted as a second JSON key alongside the {@code @JsonProperty}.
     */
    @JsonProperty("xPosition")
    public Integer getXPosition() {
        return xPosition;
    }

    @JsonProperty("yPosition")
    public Integer getYPosition() {
        return yPosition;
    }
}
