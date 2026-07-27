package com.pos.backend.dto.request.Settings;

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
public class PrintSettingRequest {

    Boolean enablePrint;
    Boolean showStoreDetails;
    Boolean showCustomerDetails;
    Boolean showNotes;
    Boolean printTokens;
    String pageSize;
    String headerText;
    String footerText;
}
