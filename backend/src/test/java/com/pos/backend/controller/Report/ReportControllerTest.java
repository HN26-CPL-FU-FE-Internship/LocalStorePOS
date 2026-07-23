// package com.pos.backend.controller.Report;

// import com.pos.backend.dto.response.ApiResponse;
// import com.pos.backend.dto.response.Report.EarningReportResponse;
// import com.pos.backend.dto.response.Report.OrderReportResponse;
// import com.pos.backend.dto.response.Report.SalesReportResponse;
// import com.pos.backend.dto.response.Report.CustomerReportResponse;
// import com.pos.backend.service.Report.ReportService;
// import org.junit.jupiter.api.BeforeEach;
// import org.junit.jupiter.api.Test;
// import org.junit.jupiter.api.extension.ExtendWith;
// import org.mockito.InjectMocks;
// import org.mockito.Mock;
// import org.mockito.junit.jupiter.MockitoExtension;
// import org.springframework.http.MediaType;
// import org.springframework.test.web.servlet.MockMvc;
// import org.springframework.test.web.servlet.setup.MockMvcBuilders;

// import java.math.BigDecimal;
// import java.time.LocalDateTime;
// import java.util.List;

// import static org.mockito.ArgumentMatchers.*;
// import static org.mockito.Mockito.when;
// import static
// org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
// import static
// org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// @ExtendWith(MockitoExtension.class)
// class ReportControllerTest {

// @Mock
// private ReportService reportService;

// @InjectMocks
// private ReportController reportController;

// private MockMvc mockMvc;

// @BeforeEach
// void setUp() {
// mockMvc = MockMvcBuilders.standaloneSetup(reportController).build();
// }

// @Test
// void testGetEarningReport() throws Exception {
// EarningReportResponse earning1 = EarningReportResponse.builder()
// .earningId("ERN0001")
// .date(LocalDateTime.of(2026, 11, 1, 10, 0))
// .orderNumber("#23588")
// .customerName("Walk-in Customer")
// .orderType("dine_in")
// .paymentMethod("Credit Card")
// .grandTotal(BigDecimal.valueOf(34.50))
// .status("paid")
// .build();

// when(reportService.getEarningReport(any(), any(), any(), any()))
// .thenReturn(List.of(earning1));

// mockMvc.perform(get("/api/reports/earning")
// .param("fromDate", "2026-01-01")
// .param("toDate", "2026-12-31")
// .contentType(MediaType.APPLICATION_JSON))
// .andExpect(status().isOk())
// .andExpect(jsonPath("$.result[0].earningId").value("ERN0001"))
// .andExpect(jsonPath("$.result[0].customerName").value("Walk-in Customer"))
// .andExpect(jsonPath("$.result[0].grandTotal").value(34.50));
// }

// @Test
// void testGetOrderReport() throws Exception {
// OrderReportResponse order1 = OrderReportResponse.builder()
// .orderNumber("#23588")
// .date(LocalDateTime.of(2026, 11, 1, 10, 0))
// .customerName("Walk-in Customer")
// .tokenNo("16")
// .orderType("dine_in")
// .menus(3L)
// .grandTotal(BigDecimal.valueOf(34.50))
// .status("paid")
// .build();

// when(reportService.getOrderReport(any(), any(), any()))
// .thenReturn(List.of(order1));

// mockMvc.perform(get("/api/reports/orders")
// .param("fromDate", "2026-01-01")
// .param("toDate", "2026-12-31")
// .contentType(MediaType.APPLICATION_JSON))
// .andExpect(status().isOk())
// .andExpect(jsonPath("$.result[0].orderNumber").value("#23588"))
// .andExpect(jsonPath("$.result[0].customerName").value("Walk-in Customer"))
// .andExpect(jsonPath("$.result[0].menus").value(3));
// }

// @Test
// void testGetSalesReport() throws Exception {
// SalesReportResponse sales1 = SalesReportResponse.builder()
// .salesId("SA0001")
// .date(LocalDateTime.of(2026, 11, 1, 10, 0))
// .categoryName("Sea Food")
// .itemsSold(28L)
// .totalOrders(32L)
// .grandTotal(BigDecimal.valueOf(1000))
// .status("completed")
// .build();

// when(reportService.getSalesReport(any(), any(), any()))
// .thenReturn(List.of(sales1));

// mockMvc.perform(get("/api/reports/sales")
// .param("fromDate", "2026-01-01")
// .param("toDate", "2026-12-31")
// .contentType(MediaType.APPLICATION_JSON))
// .andExpect(status().isOk())
// .andExpect(jsonPath("$.result[0].salesId").value("SA0001"))
// .andExpect(jsonPath("$.result[0].categoryName").value("Sea Food"))
// .andExpect(jsonPath("$.result[0].itemsSold").value(28));
// }

// @Test
// void testGetCustomerReport() throws Exception {
// CustomerReportResponse customer1 = CustomerReportResponse.builder()
// .customerId("CUS0001")
// .customerName("Walk-in Customer")
// .avatarPath(null)
// .totalOrders(32L)
// .grandTotal(BigDecimal.valueOf(1000))
// .build();

// when(reportService.getCustomerReport(any(), any(), any()))
// .thenReturn(List.of(customer1));

// mockMvc.perform(get("/api/reports/customers")
// .param("fromDate", "2026-01-01")
// .param("toDate", "2026-12-31")
// .contentType(MediaType.APPLICATION_JSON))
// .andExpect(status().isOk())
// .andExpect(jsonPath("$.result[0].customerId").value("CUS0001"))
// .andExpect(jsonPath("$.result[0].customerName").value("Walk-in Customer"))
// .andExpect(jsonPath("$.result[0].totalOrders").value(32));
// }

// @Test
// void testGetEarningReport_noFilters() throws Exception {
// when(reportService.getEarningReport(any(), any(), any(), any()))
// .thenReturn(List.of());

// mockMvc.perform(get("/api/reports/earning")
// .contentType(MediaType.APPLICATION_JSON))
// .andExpect(status().isOk())
// .andExpect(jsonPath("$.result").isArray())
// .andExpect(jsonPath("$.result.length()").value(0));
// }

// @Test
// void testGetEarningReport_withCustomerFilter() throws Exception {
// EarningReportResponse earning1 = EarningReportResponse.builder()
// .earningId("ERN0001")
// .date(LocalDateTime.of(2026, 11, 1, 10, 0))
// .orderNumber("#23588")
// .customerName("Sue Allen")
// .orderType("take_away")
// .paymentMethod("Cash")
// .grandTotal(BigDecimal.valueOf(78.20))
// .status("paid")
// .build();

// when(reportService.getEarningReport(any(), any(), eq("Sue"), any()))
// .thenReturn(List.of(earning1));

// mockMvc.perform(get("/api/reports/earning")
// .param("customerName", "Sue")
// .contentType(MediaType.APPLICATION_JSON))
// .andExpect(status().isOk())
// .andExpect(jsonPath("$.result[0].customerName").value("Sue Allen"));
// }

// @Test
// void testGetSalesReport_withCategoryFilter() throws Exception {
// SalesReportResponse sales1 = SalesReportResponse.builder()
// .salesId("SA0003")
// .date(LocalDateTime.of(2026, 11, 1, 10, 0))
// .categoryName("Pizza")
// .itemsSold(42L)
// .totalOrders(45L)
// .grandTotal(BigDecimal.valueOf(1500))
// .status("completed")
// .build();

// when(reportService.getSalesReport(any(), any(), eq("Pizza")))
// .thenReturn(List.of(sales1));

// mockMvc.perform(get("/api/reports/sales")
// .param("categoryName", "Pizza")
// .contentType(MediaType.APPLICATION_JSON))
// .andExpect(status().isOk())
// .andExpect(jsonPath("$.result[0].categoryName").value("Pizza"))
// .andExpect(jsonPath("$.result[0].grandTotal").value(1500));
// }

// @Test
// void testGetCustomerReport_withSearch() throws Exception {
// CustomerReportResponse customer1 = CustomerReportResponse.builder()
// .customerId("CUS0005")
// .customerName("Jim Vickers")
// .avatarPath(null)
// .totalOrders(34L)
// .grandTotal(BigDecimal.valueOf(750))
// .build();

// when(reportService.getCustomerReport(any(), any(), eq("Jim")))
// .thenReturn(List.of(customer1));

// mockMvc.perform(get("/api/reports/customers")
// .param("customerName", "Jim")
// .contentType(MediaType.APPLICATION_JSON))
// .andExpect(status().isOk())
// .andExpect(jsonPath("$.result[0].customerName").value("Jim Vickers"))
// .andExpect(jsonPath("$.result[0].totalOrders").value(34));
// }
// }
