package com.pos.backend.service.Addon;

import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.dto.request.Addon.AddonRequest;
import com.pos.backend.dto.response.Addon.AddonListItemResponse;
import com.pos.backend.service.Common.PageResponse;

public interface AddonService {

    PageResponse<AddonListItemResponse> getAddons(
            int page,
            int size,
            String sortBy,
            String sortDir,
            String search,
            Long itemId,
            CommonStatus status);

    AddonListItemResponse getAddon(Long id);

    AddonListItemResponse createAddon(AddonRequest request);

    AddonListItemResponse updateAddon(Long id, AddonRequest request);

    AddonListItemResponse updateStatus(Long id, CommonStatus status);

    void deleteAddon(Long id);
}
