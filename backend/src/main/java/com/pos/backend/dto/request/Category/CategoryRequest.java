package com.pos.backend.dto.request.Category;

import org.springframework.web.multipart.MultipartFile;

import com.pos.backend.constant.enums.CommonStatus;

import jakarta.validation.constraints.NotBlank;
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
public class CategoryRequest {
    
    @NotBlank(message = "Category name must not be blank")
    @Size(max = 100, message = "Category name must not exceed 100 characters")
    String name;

    CommonStatus status;

    MultipartFile image;
}
