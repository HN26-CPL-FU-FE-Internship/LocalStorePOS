package com.pos.backend.controller.Report;

import java.time.LocalDate;

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
import com.pos.backend.service.Common.PageResponse;
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
        public ApiResponse<PageResponse<EarningReportResponse>> getEarningReport(
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
                        @RequestParam(required = false) String customerName,
                        @RequestParam(required = false) String paymentMethod,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {

                PageResponse<EarningReportResponse> result = reportService.getEarningReport(fromDate, toDate,
                                customerName, paymentMethod, page, size);

                return ApiResponse.<PageResponse<EarningReportResponse>>builder()
                                .result(result)
                                .build();
        }

        @GetMapping("/orders")
        public ApiResponse<PageResponse<OrderReportResponse>> getOrderReport(
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
                        @RequestParam(required = false) String customerName,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {

                PageResponse<OrderReportResponse> result = reportService.getOrderReport(fromDate, toDate, customerName,
                                page, size);

                return ApiResponse.<PageResponse<OrderReportResponse>>builder()
                                .result(result)
                                .build();
        }

        @GetMapping("/sales")
        public ApiResponse<PageResponse<SalesReportResponse>> getSalesReport(
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
                        @RequestParam(required = false) String categoryName,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {

                PageResponse<SalesReportResponse> result = reportService.getSalesReport(fromDate, toDate, categoryName,
                                page, size);

                return ApiResponse.<PageResponse<SalesReportResponse>>builder()
                                .result(result)
                                .build();
        }

        @GetMapping("/customers")
        public ApiResponse<PageResponse<CustomerReportResponse>> getCustomerReport(
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
                        @RequestParam(required = false) String customerName,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {

                PageResponse<CustomerReportResponse> result = reportService.getCustomerReport(fromDate, toDate,
                                customerName, page, size);

                return ApiResponse.<PageResponse<CustomerReportResponse>>builder()
                                .result(result)
                                .build();
        }
}
