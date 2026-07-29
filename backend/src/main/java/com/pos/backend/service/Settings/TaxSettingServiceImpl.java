package com.pos.backend.service.Settings;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.AuditAction;
import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.dto.request.Settings.TaxSettingRequest;
import com.pos.backend.dto.response.Common.OptionResponse;
import com.pos.backend.dto.response.Settings.TaxSettingResponse;
import com.pos.backend.entity.Tax;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.TaxRepository;
import com.pos.backend.service.Audit.AuditLogService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TaxSettingServiceImpl implements TaxSettingService {

    private final AuditLogService auditLogService;

    private final TaxRepository taxRepository;

    @Override
    @Transactional(readOnly = true)
    public List<OptionResponse> getTaxOptions() {
        return taxRepository.findByStatusOrderByTitleAsc(CommonStatus.active)
                .stream()
                .map(tax -> OptionResponse.builder()
                        .id(tax.getId())
                        .name(tax.getTitle() + " (" + tax.getTaxRate() + "%)")
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaxSettingResponse> getAllTaxes() {
        return taxRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TaxSettingResponse getTax(Long id) {
        return toResponse(findTaxOrThrow(id));
    }

    @Override
    @Transactional
    public TaxSettingResponse createTax(TaxSettingRequest request) {
        Tax tax = Tax.builder()
                .title(request.getTitle())
                .taxRate(java.math.BigDecimal.valueOf(request.getTaxRate()))
                .taxType(request.getTaxType())
                .status(request.getStatus() != null ? request.getStatus() : CommonStatus.active)
                .build();
        TaxSettingResponse response = toResponse(taxRepository.save(tax));
        auditLogService.log(null, AuditAction.TAX_SETTINGS_UPDATED, "SETTINGS", "Tax", tax.getId(),
                "Tax created: " + tax.getTitle() + " (" + tax.getTaxRate() + "%)",
                null, null, "SUCCESS", null);
        return response;
    }

    @Override
    @Transactional
    public TaxSettingResponse updateTax(Long id, TaxSettingRequest request) {
        Tax tax = findTaxOrThrow(id);
        tax.setTitle(request.getTitle());
        tax.setTaxRate(java.math.BigDecimal.valueOf(request.getTaxRate()));
        tax.setTaxType(request.getTaxType());
        if (request.getStatus() != null) {
            tax.setStatus(request.getStatus());
        }
        TaxSettingResponse response = toResponse(taxRepository.save(tax));
        auditLogService.log(null, AuditAction.TAX_SETTINGS_UPDATED, "SETTINGS", "Tax", id,
                "Tax updated: " + tax.getTitle(), null, null, "SUCCESS", null);
        return response;
    }

    @Override
    @Transactional
    public TaxSettingResponse updateTaxStatus(Long id, CommonStatus status) {
        Tax tax = findTaxOrThrow(id);
        tax.setStatus(status);
        TaxSettingResponse response = toResponse(taxRepository.save(tax));
        auditLogService.log(null, AuditAction.TAX_SETTINGS_UPDATED, "SETTINGS", "Tax", id,
                "Tax status updated to " + status.name(), null, null, "SUCCESS", null);
        return response;
    }

    @Override
    @Transactional
    public void deleteTax(Long id) {
        Tax tax = findTaxOrThrow(id);
        taxRepository.delete(tax);
        auditLogService.log(null, AuditAction.TAX_SETTINGS_UPDATED, "SETTINGS", "Tax", id,
                "Tax deleted: " + tax.getTitle(), null, null, "SUCCESS", null);
    }

    private Tax findTaxOrThrow(Long id) {
        return taxRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TAX_NOT_FOUND));
    }

    private TaxSettingResponse toResponse(Tax tax) {
        return TaxSettingResponse.builder()
                .id(tax.getId())
                .title(tax.getTitle())
                .taxRate(tax.getTaxRate().doubleValue())
                .taxType(tax.getTaxType().name())
                .status(tax.getStatus().name())
                .createdAt(tax.getCreatedAt())
                .updatedAt(tax.getUpdatedAt())
                .build();
    }
}
