package com.pos.backend.controller.Report;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Report.CustomerReportResponse;
import com.pos.backend.dto.response.Report.EarningReportResponse;
import com.pos.backend.dto.response.Report.OrderReportResponse;
import com.pos.backend.dto.response.Report.SalesReportResponse;
import com.pos.backend.service.Report.ReportService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/api/reports")
public class ReportController {

    ReportService reportService;

    @GetMapping("/earning")
    public ApiResponse<List<EarningReportResponse>> getEarningReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String customerName,
            @RequestParam(required = false) String paymentMethod) {

        List<EarningReportResponse> result = reportService.getEarningReport(fromDate, toDate, customerName, paymentMethod);

        return ApiResponse.<List<EarningReportResponse>>builder()
                .result(result)
                .build();
    }

    @GetMapping("/orders")
    public ApiResponse<List<OrderReportResponse>> getOrderReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String customerName) {

        List<OrderReportResponse> result = reportService.getOrderReport(fromDate, toDate, customerName);

        return ApiResponse.<List<OrderReportResponse>>builder()
                .result(result)
                .build();
    }

    @GetMapping("/sales")
    public ApiResponse<List<SalesReportResponse>> getSalesReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String categoryName) {

        List<SalesReportResponse> result = reportService.getSalesReport(fromDate, toDate, categoryName);

        return ApiResponse.<List<SalesReportResponse>>builder()
                .result(result)
                .build();
    }

    @GetMapping("/customers")
    public ApiResponse<List<CustomerReportResponse>> getCustomerReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String customerName) {

        List<CustomerReportResponse> result = reportService.getCustomerReport(fromDate, toDate, customerName);

        return ApiResponse.<List<CustomerReportResponse>>builder()
                .result(result)
                .build();
    }
}
