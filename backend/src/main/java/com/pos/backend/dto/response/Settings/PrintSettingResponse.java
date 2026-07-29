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
public class PrintSettingResponse {
    Long id;
    Boolean enablePrint;
    Boolean showStoreDetails;
    Boolean showCustomerDetails;
    Boolean showNotes;
    Boolean printTokens;
    String pageSize;
    String headerText;
    String footerText;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
