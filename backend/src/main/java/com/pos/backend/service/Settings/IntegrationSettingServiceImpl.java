package com.pos.backend.service.Settings;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.dto.response.Settings.IntegrationSettingResponse;
import com.pos.backend.entity.Integration;
import com.pos.backend.repository.IntegrationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class IntegrationSettingServiceImpl {

    private final IntegrationRepository integrationRepository;

    @Transactional
    public List<IntegrationSettingResponse> getAllIntegrations() {
        // Seeds default integration rows on first load, so this getter must
        // run in a read-write transaction.
        List<Integration> integrations = integrationRepository.findAll();
        if (integrations.isEmpty()) {
            // Seed default integrations
            integrations = List.of(
                    createIntegration("gmail", "Gmail"),
                    createIntegration("gupshup", "Gupshup"),
                    createIntegration("printnode", "PrintNode"));
        }
        return integrations.stream().map(this::toResponse).toList();
    }

    private Integration createIntegration(String code, String name) {
        return integrationRepository.save(
                Integration.builder()
                        .providerCode(code)
                        .providerName(name)
                        .isConnected(false)
                        .build());
    }

    @Transactional
    public IntegrationSettingResponse toggleIntegration(Long id) {
        Integration integration = integrationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Integration not found"));
        integration.setIsConnected(!integration.getIsConnected());
        integration = integrationRepository.save(integration);
        return toResponse(integration);
    }

    private IntegrationSettingResponse toResponse(Integration integration) {
        return IntegrationSettingResponse.builder()
                .id(integration.getId())
                .providerCode(integration.getProviderCode())
                .providerName(integration.getProviderName())
                .isConnected(integration.getIsConnected())
                .configJson(integration.getConfigJson())
                .createdAt(integration.getCreatedAt())
                .updatedAt(integration.getUpdatedAt())
                .build();
    }
}
