package com.pos.backend.service.Settings;

import java.util.List;

import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.dto.request.Settings.TaxSettingRequest;
import com.pos.backend.dto.response.Common.OptionResponse;
import com.pos.backend.dto.response.Settings.TaxSettingResponse;

public interface TaxSettingService {
    List<OptionResponse> getTaxOptions();
    List<TaxSettingResponse> getAllTaxes();
    TaxSettingResponse getTax(Long id);
    TaxSettingResponse createTax(TaxSettingRequest request);
    TaxSettingResponse updateTax(Long id, TaxSettingRequest request);
    TaxSettingResponse updateTaxStatus(Long id, CommonStatus status);
    void deleteTax(Long id);
}
