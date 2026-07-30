package com.pos.backend.service.Dashboard.metrics;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.pos.backend.constant.enums.OrderPaymentStatus;
import com.pos.backend.constant.enums.OrderStatus;
import com.pos.backend.dto.response.Dashboard.DashboardStatsResponse;
import com.pos.backend.dto.response.Dashboard.SalesPerformanceResponse;
import com.pos.backend.repository.OrderRepository;

@ExtendWith(MockitoExtension.class)
class SalesMetricProviderImplTest {

    @Mock
    private OrderRepository orderRepository;

    private SalesMetricProviderImpl salesMetricProvider;

    @BeforeEach
    void setUp() {
        salesMetricProvider = new SalesMetricProviderImpl(orderRepository);
    }

    @Test
    void fillSalesStats_shouldComputeAverageOrderValueFromCompletedPaidOrders() {
        LocalDateTime fromDate = LocalDateTime.of(2024, 7, 1, 0, 0);
        LocalDateTime toDate = LocalDateTime.of(2024, 7, 31, 23, 59, 59, 999_999_999);

        when(orderRepository.sumGrandTotalBetween(fromDate, toDate, OrderStatus.completed, OrderPaymentStatus.paid))
                .thenReturn(new BigDecimal("1000.00"));
        when(orderRepository.countCompletedPaidOrdersBetween(fromDate, toDate, OrderStatus.completed,
                OrderPaymentStatus.paid)).thenReturn(10L);

        DashboardStatsResponse stats = new DashboardStatsResponse();
        stats.setTotalOrders(20);
        salesMetricProvider.fillSalesStats(stats, fromDate, toDate);

        assertEquals(new BigDecimal("1000.00"), stats.getTotalSales());
        assertEquals(new BigDecimal("100.00"), stats.getAverageOrderValue());
    }

    @Test
    void fillSalesStats_shouldReturnZeroAverageWhenNoCompletedPaidOrders() {
        LocalDateTime fromDate = LocalDateTime.of(2024, 7, 1, 0, 0);
        LocalDateTime toDate = LocalDateTime.of(2024, 7, 31, 23, 59, 59, 999_999_999);

        when(orderRepository.sumGrandTotalBetween(fromDate, toDate, OrderStatus.completed, OrderPaymentStatus.paid))
                .thenReturn(BigDecimal.ZERO);
        when(orderRepository.countCompletedPaidOrdersBetween(fromDate, toDate, OrderStatus.completed,
                OrderPaymentStatus.paid)).thenReturn(0L);

        DashboardStatsResponse stats = new DashboardStatsResponse();
        stats.setTotalOrders(20);
        salesMetricProvider.fillSalesStats(stats, fromDate, toDate);

        assertEquals(BigDecimal.ZERO, stats.getTotalSales());
        assertEquals(BigDecimal.ZERO, stats.getAverageOrderValue());
    }

    @Test
    void getSalesPerformance_whenCurrentHigherThanPrevious_shouldReturnPositiveChange() {
        LocalDateTime fromDate = LocalDateTime.of(2024, 7, 1, 0, 0);
        LocalDateTime toDate = LocalDateTime.of(2024, 7, 31, 23, 59, 59, 999_999_999);

        mockRepositoryForPeriod(fromDate, toDate, 10L, new BigDecimal("1000.00"));
        mockRepositoryForPeriod(
                LocalDateTime.of(2024, 5, 31, 0, 0),
                LocalDateTime.of(2024, 6, 30, 23, 59, 59, 999_999_999),
                5L,
                new BigDecimal("500.00"));

        List<SalesPerformanceResponse> result = salesMetricProvider.getSalesPerformance(fromDate, toDate);

        assertEquals(2, result.size());
        assertEquals("Total Orders", result.get(0).getLabel());
        assertEquals("10", result.get(0).getValue());
        assertEquals("+100.0%", result.get(0).getChange());

        assertEquals("Total Sales", result.get(1).getLabel());
        assertEquals("1000.00", result.get(1).getValue());
        assertEquals("+100.0%", result.get(1).getChange());
    }

    @Test
    void getSalesPerformance_whenCurrentLowerThanPrevious_shouldReturnNegativeChange() {
        LocalDateTime fromDate = LocalDateTime.of(2024, 7, 1, 0, 0);
        LocalDateTime toDate = LocalDateTime.of(2024, 7, 31, 23, 59, 59, 999_999_999);

        mockRepositoryForPeriod(fromDate, toDate, 5L, new BigDecimal("500.00"));
        mockRepositoryForPeriod(
                LocalDateTime.of(2024, 5, 31, 0, 0),
                LocalDateTime.of(2024, 6, 30, 23, 59, 59, 999_999_999),
                10L,
                new BigDecimal("1000.00"));

        List<SalesPerformanceResponse> result = salesMetricProvider.getSalesPerformance(fromDate, toDate);

        assertEquals("-50.0%", result.get(0).getChange());
        assertEquals("-50.0%", result.get(1).getChange());
    }

    @Test
    void getSalesPerformance_whenPreviousIsZero_shouldReturnPlusOneHundredPercent() {
        LocalDateTime fromDate = LocalDateTime.of(2024, 7, 1, 0, 0);
        LocalDateTime toDate = LocalDateTime.of(2024, 7, 31, 23, 59, 59, 999_999_999);

        mockRepositoryForPeriod(fromDate, toDate, 5L, new BigDecimal("500.00"));
        mockRepositoryForPeriod(
                LocalDateTime.of(2024, 5, 31, 0, 0),
                LocalDateTime.of(2024, 6, 30, 23, 59, 59, 999_999_999),
                0L,
                BigDecimal.ZERO);

        List<SalesPerformanceResponse> result = salesMetricProvider.getSalesPerformance(fromDate, toDate);

        assertEquals("+100.0%", result.get(0).getChange());
        assertEquals("+100.0%", result.get(1).getChange());
    }

    @Test
    void getSalesPerformance_whenCurrentEqualsPrevious_shouldReturnZeroPercent() {
        LocalDateTime fromDate = LocalDateTime.of(2024, 7, 1, 0, 0);
        LocalDateTime toDate = LocalDateTime.of(2024, 7, 31, 23, 59, 59, 999_999_999);

        mockRepositoryForPeriod(fromDate, toDate, 10L, new BigDecimal("1000.00"));
        mockRepositoryForPeriod(
                LocalDateTime.of(2024, 5, 31, 0, 0),
                LocalDateTime.of(2024, 6, 30, 23, 59, 59, 999_999_999),
                10L,
                new BigDecimal("1000.00"));

        List<SalesPerformanceResponse> result = salesMetricProvider.getSalesPerformance(fromDate, toDate);

        assertEquals("+0.0%", result.get(0).getChange());
        assertEquals("+0.0%", result.get(1).getChange());
    }

    @Test
    void getSalesPerformance_forSingleDay_shouldMirrorPreviousDay() {
        LocalDateTime fromDate = LocalDateTime.of(2024, 7, 15, 0, 0);
        LocalDateTime toDate = LocalDateTime.of(2024, 7, 15, 23, 59, 59, 999_999_999);

        mockRepositoryForPeriod(fromDate, toDate, 8L, new BigDecimal("800.00"));
        mockRepositoryForPeriod(
                LocalDateTime.of(2024, 7, 14, 0, 0),
                LocalDateTime.of(2024, 7, 14, 23, 59, 59, 999_999_999),
                4L,
                new BigDecimal("400.00"));

        List<SalesPerformanceResponse> result = salesMetricProvider.getSalesPerformance(fromDate, toDate);

        assertEquals("+100.0%", result.get(0).getChange());
        assertEquals("+100.0%", result.get(1).getChange());
    }

    @Test
    void getSalesPerformance_forArbitraryTimeRange_shouldMirrorSameDuration() {
        LocalDateTime fromDate = LocalDateTime.of(2024, 7, 1, 10, 0);
        LocalDateTime toDate = LocalDateTime.of(2024, 7, 3, 14, 0);

        mockRepositoryForPeriod(fromDate, toDate, 6L, new BigDecimal("600.00"));
        mockRepositoryForPeriod(
                LocalDateTime.of(2024, 6, 29, 5, 59, 59, 999_999_999),
                LocalDateTime.of(2024, 7, 1, 9, 59, 59, 999_999_999),
                3L,
                new BigDecimal("300.00"));

        List<SalesPerformanceResponse> result = salesMetricProvider.getSalesPerformance(fromDate, toDate);

        assertEquals("+100.0%", result.get(0).getChange());
        assertEquals("+100.0%", result.get(1).getChange());
    }

    @Test
    void getSalesPerformance_whenCurrentIsZero_shouldReturnMinusOneHundredPercent() {
        LocalDateTime fromDate = LocalDateTime.of(2024, 7, 1, 0, 0);
        LocalDateTime toDate = LocalDateTime.of(2024, 7, 31, 23, 59, 59, 999_999_999);

        mockRepositoryForPeriod(fromDate, toDate, 0L, BigDecimal.ZERO);
        mockRepositoryForPeriod(
                LocalDateTime.of(2024, 5, 31, 0, 0),
                LocalDateTime.of(2024, 6, 30, 23, 59, 59, 999_999_999),
                10L,
                new BigDecimal("1000.00"));

        List<SalesPerformanceResponse> result = salesMetricProvider.getSalesPerformance(fromDate, toDate);

        assertEquals("-100.0%", result.get(0).getChange());
        assertEquals("-100.0%", result.get(1).getChange());
    }

    @Test
    void getSalesPerformance_whenCurrentAndPreviousAreZero_shouldReturnZeroPercent() {
        LocalDateTime fromDate = LocalDateTime.of(2024, 7, 1, 0, 0);
        LocalDateTime toDate = LocalDateTime.of(2024, 7, 31, 23, 59, 59, 999_999_999);

        mockRepositoryForPeriod(fromDate, toDate, 0L, BigDecimal.ZERO);
        mockRepositoryForPeriod(
                LocalDateTime.of(2024, 5, 31, 0, 0),
                LocalDateTime.of(2024, 6, 30, 23, 59, 59, 999_999_999),
                0L,
                BigDecimal.ZERO);

        List<SalesPerformanceResponse> result = salesMetricProvider.getSalesPerformance(fromDate, toDate);

        assertEquals("0.0%", result.get(0).getChange());
        assertEquals("0.0%", result.get(1).getChange());
    }

    private void mockRepositoryForPeriod(LocalDateTime fromDate, LocalDateTime toDate, long orders,
            BigDecimal sales) {
        when(orderRepository.countCompletedPaidOrdersBetween(fromDate, toDate, OrderStatus.completed,
                OrderPaymentStatus.paid)).thenReturn(orders);
        when(orderRepository.sumGrandTotalBetween(fromDate, toDate, OrderStatus.completed, OrderPaymentStatus.paid))
                .thenReturn(sales);
    }
}
