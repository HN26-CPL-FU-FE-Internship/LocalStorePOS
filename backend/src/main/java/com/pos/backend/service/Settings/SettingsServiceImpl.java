package com.pos.backend.service.Settings;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.dto.request.Settings.StoreSettingRequest;
import com.pos.backend.dto.response.Settings.StoreSettingResponse;
import com.pos.backend.entity.Store;
import com.pos.backend.repository.StoreRepository;
import com.pos.backend.util.FileStorageUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SettingsServiceImpl implements SettingsService {

    private static final String IMAGE_SUB_FOLDER = "stores";

    private final StoreRepository storeRepository;
    private final FileStorageUtil fileStorageUtil;

    private Store getOrCreateStore() {
        return storeRepository.findAll()
                .stream()
                .findFirst()
                .orElseGet(() -> storeRepository.save(
                        Store.builder()
                                .name("My Store")
                                .addressLine1("123 Main St")
                                .currencyCode("USD")
                                .timezone("UTC")
                                .build()));
    }

    @Override
    @Transactional(readOnly = true)
    public StoreSettingResponse getStoreSetting() {
        Store store = getOrCreateStore();
        return toResponse(store);
    }

    @Override
    @Transactional
    public StoreSettingResponse updateStoreSetting(StoreSettingRequest request) {
        Store store = getOrCreateStore();

        store.setName(request.getName());
        store.setAddressLine1(request.getAddressLine1());
        store.setAddressLine2(request.getAddressLine2());
        store.setCity(request.getCity());
        store.setState(request.getState());
        store.setCountry(request.getCountry());
        store.setPostalCode(request.getPostalCode());
        store.setEmail(request.getEmail());
        store.setPhone(request.getPhone());
        store.setCurrencyCode(request.getCurrencyCode());
        store.setTimezone(request.getTimezone());

        if (request.getEnableQrMenu() != null) store.setEnableQrMenu(request.getEnableQrMenu());
        if (request.getEnableTakeaway() != null) store.setEnableTakeaway(request.getEnableTakeaway());
        if (request.getEnableDineIn() != null) store.setEnableDineIn(request.getEnableDineIn());
        if (request.getEnableReservation() != null) store.setEnableReservation(request.getEnableReservation());
        if (request.getEnableOrderViaQr() != null) store.setEnableOrderViaQr(request.getEnableOrderViaQr());
        if (request.getEnableDelivery() != null) store.setEnableDelivery(request.getEnableDelivery());
        if (request.getEnableTable() != null) store.setEnableTable(request.getEnableTable());

        if (request.getImage() != null && !request.getImage().isEmpty()) {
            String oldPath = store.getImagePath();
            String newPath = fileStorageUtil.storeImage(request.getImage(), IMAGE_SUB_FOLDER);
            store.setImagePath(newPath);
            fileStorageUtil.deleteFile(oldPath);
        }

        store = storeRepository.save(store);
        return toResponse(store);
    }

    private StoreSettingResponse toResponse(Store store) {
        return StoreSettingResponse.builder()
                .id(store.getId())
                .name(store.getName())
                .imagePath(store.getImagePath())
                .addressLine1(store.getAddressLine1())
                .addressLine2(store.getAddressLine2())
                .city(store.getCity())
                .state(store.getState())
                .country(store.getCountry())
                .postalCode(store.getPostalCode())
                .email(store.getEmail())
                .phone(store.getPhone())
                .currencyCode(store.getCurrencyCode())
                .timezone(store.getTimezone())
                .enableQrMenu(store.getEnableQrMenu())
                .enableTakeaway(store.getEnableTakeaway())
                .enableDineIn(store.getEnableDineIn())
                .enableReservation(store.getEnableReservation())
                .enableOrderViaQr(store.getEnableOrderViaQr())
                .enableDelivery(store.getEnableDelivery())
                .enableTable(store.getEnableTable())
                .createdAt(store.getCreatedAt())
                .updatedAt(store.getUpdatedAt())
                .build();
    }
}
