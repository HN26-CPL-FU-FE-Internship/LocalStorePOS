package com.pos.backend.controller.Tax;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Common.OptionResponse;
import com.pos.backend.repository.TaxRepository;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/taxes")
@RequiredArgsConstructor
public class TaxController {

    private final TaxRepository taxRepository;

    @GetMapping("/options")
    public ApiResponse<List<OptionResponse>> getTaxOptions() {
        List<OptionResponse> options = taxRepository.findByStatusOrderByTitleAsc(CommonStatus.active)
                .stream()
                .map(tax -> OptionResponse.builder()
                        .id(tax.getId())
                        .name(tax.getTitle() + " (" + tax.getTaxRate() + "%)")
                        .build())
                .toList();

        return ApiResponse.<List<OptionResponse>>builder()
                .message("Success")
                .result(options)
                .build();
    }
}
