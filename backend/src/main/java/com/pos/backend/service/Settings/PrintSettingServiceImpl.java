package com.pos.backend.service.Settings;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.dto.request.Settings.PrintSettingRequest;
import com.pos.backend.dto.response.Settings.PrintSettingResponse;
import com.pos.backend.entity.PrintSetting;
import com.pos.backend.entity.Store;
import com.pos.backend.repository.PrintSettingRepository;
import com.pos.backend.repository.StoreRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PrintSettingServiceImpl {

    private final PrintSettingRepository printSettingRepository;
    private final StoreRepository storeRepository;

    private Store getOrCreateStore() {
        return storeRepository.findAll()
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No store configured"));
    }

    private PrintSetting getOrCreate() {
        return printSettingRepository.findAll()
                .stream()
                .findFirst()
                .orElseGet(() -> printSettingRepository.save(
                        PrintSetting.builder()
                                .store(getOrCreateStore())
                                .enablePrint(true)
                                .showStoreDetails(true)
                                .showCustomerDetails(true)
                                .pageSize("A4")
                                .build()));
    }

    @Transactional(readOnly = true)
    public PrintSettingResponse getPrintSetting() {
        return toResponse(getOrCreate());
    }

    @Transactional
    public PrintSettingResponse updatePrintSetting(PrintSettingRequest request) {
        PrintSetting setting = getOrCreate();

        if (request.getEnablePrint() != null) setting.setEnablePrint(request.getEnablePrint());
        if (request.getShowStoreDetails() != null) setting.setShowStoreDetails(request.getShowStoreDetails());
        if (request.getShowCustomerDetails() != null) setting.setShowCustomerDetails(request.getShowCustomerDetails());
        if (request.getPageSize() != null) setting.setPageSize(request.getPageSize());
        if (request.getShowNotes() != null) setting.setShowNotes(request.getShowNotes());
        if (request.getPrintTokens() != null) setting.setPrintTokens(request.getPrintTokens());
        if (request.getHeaderText() != null) setting.setHeaderText(request.getHeaderText());
        if (request.getFooterText() != null) setting.setFooterText(request.getFooterText());

        setting = printSettingRepository.save(setting);
        return toResponse(setting);
    }

    private PrintSettingResponse toResponse(PrintSetting setting) {
        return PrintSettingResponse.builder()
                .id(setting.getId())
                .enablePrint(setting.getEnablePrint())
                .showStoreDetails(setting.getShowStoreDetails())
                .showCustomerDetails(setting.getShowCustomerDetails())
                .showNotes(setting.getShowNotes())
                .printTokens(setting.getPrintTokens())
                .pageSize(setting.getPageSize())
                .headerText(setting.getHeaderText())
                .footerText(setting.getFooterText())
                .createdAt(setting.getCreatedAt())
                .updatedAt(setting.getUpdatedAt())
                .build();
    }
}
