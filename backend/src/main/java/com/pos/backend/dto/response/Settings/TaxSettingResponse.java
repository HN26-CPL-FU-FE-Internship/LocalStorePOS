package com.pos.backend.dto.response.Settings;

import java.time.LocalDateTime;

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
public class TaxSettingResponse {
    Long id;
    String title;
    Double taxRate;
    String taxType;
    String status;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
