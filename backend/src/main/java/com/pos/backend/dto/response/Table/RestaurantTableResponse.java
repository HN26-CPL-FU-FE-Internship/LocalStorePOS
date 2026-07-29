package com.pos.backend.dto.response.Table;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RestaurantTableResponse {
    private Long id;
    private String tableNumber;
    private Long areaId;
    private String areaName;
    private Integer seats;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
