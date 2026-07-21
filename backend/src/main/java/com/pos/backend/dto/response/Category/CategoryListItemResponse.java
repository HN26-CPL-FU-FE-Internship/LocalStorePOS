package com.pos.backend.dto.response.Category;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CategoryListItemResponse {
    
    private long id;

    private String name;

    private String imagePath;

    private long itemCount;

    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
