package com.pos.backend.service.Settings;

import com.pos.backend.dto.response.Settings.StoreSettingResponse;
import com.pos.backend.dto.request.Settings.StoreSettingRequest;

public interface SettingsService {
    StoreSettingResponse getStoreSetting();

    StoreSettingResponse updateStoreSetting(StoreSettingRequest request);
}
