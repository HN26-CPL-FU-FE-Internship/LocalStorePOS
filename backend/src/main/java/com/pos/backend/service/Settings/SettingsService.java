package com.pos.backend.service.Settings;

import java.util.List;

import com.pos.backend.dto.response.Settings.StoreSettingResponse;
import com.pos.backend.dto.request.Settings.StoreSettingRequest;

public interface SettingsService {
    StoreSettingResponse getStoreSetting();
    StoreSettingResponse updateStoreSetting(StoreSettingRequest request);
}
