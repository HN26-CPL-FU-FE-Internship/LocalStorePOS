package com.pos.backend.service.Dashboard.metrics;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.pos.backend.constant.enums.OrderPaymentStatus;
import com.pos.backend.constant.enums.OrderStatus;
import com.pos.backend.dto.response.Dashboard.DatePointResponse;
import com.pos.backend.dto.response.Dashboard.DashboardStatsResponse;
import com.pos.backend.dto.response.Dashboard.SalesPerformanceResponse;
import com.pos.backend.repository.OrderRepository;
import com.pos.backend.util.DateRangeUtils;
import com.pos.backend.util.DateRangeUtils.Period;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SalesMetricProviderImpl implements SalesMetricProvider {

    static final DateTimeFormatter DATE_LABEL_FORMATTER = DateTimeFormatter.ofPattern("dd MMM");

    OrderRepository orderRepository;

    @Override
    public void fillSalesStats(DashboardStatsResponse stats, LocalDateTime fromDate, LocalDateTime toDate) {
        BigDecimal totalSales = orderRepository.sumGrandTotalBetween(fromDate, toDate, OrderStatus.completed,
                OrderPaymentStatus.paid);
        long completedPaidOrders = orderRepository.countCompletedPaidOrdersBetween(fromDate, toDate,
                OrderStatus.completed, OrderPaymentStatus.paid);
        BigDecimal averageOrderValue = completedPaidOrders > 0
                ? totalSales.divide(BigDecimal.valueOf(completedPaidOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        stats.setTotalSales(totalSales);
        stats.setAverageOrderValue(averageOrderValue);
    }

    @Override
    public List<DatePointResponse> getRevenueChart(LocalDateTime fromDate, LocalDateTime toDate) {
        List<Object[]> rawData = orderRepository.getRevenueByDateBetween(fromDate, toDate, OrderStatus.completed,
                OrderPaymentStatus.paid);
        Map<LocalDate, BigDecimal> revenueByDate = rawData.stream()
                .collect(Collectors.toMap(
                        row -> convertToLocalDate(row[0]),
                        row -> (BigDecimal) row[1],
                        (existing, replacement) -> replacement));

        return fillMissingDatePoints(fromDate.toLocalDate(), toDate.toLocalDate(), revenueByDate);
    }

    @Override
    public List<SalesPerformanceResponse> getSalesPerformance(LocalDateTime fromDate, LocalDateTime toDate) {
        long currentOrders = orderRepository.countCompletedPaidOrdersBetween(fromDate, toDate, OrderStatus.completed,
                OrderPaymentStatus.paid);
        BigDecimal currentSales = orderRepository.sumGrandTotalBetween(fromDate, toDate, OrderStatus.completed,
                OrderPaymentStatus.paid);

        Period previousPeriod = DateRangeUtils.resolvePreviousPeriod(fromDate, toDate);
        long previousOrders = orderRepository.countCompletedPaidOrdersBetween(previousPeriod.fromDate(),
                previousPeriod.toDate(), OrderStatus.completed, OrderPaymentStatus.paid);
        BigDecimal previousSales = orderRepository.sumGrandTotalBetween(previousPeriod.fromDate(), previousPeriod.toDate(),
                OrderStatus.completed, OrderPaymentStatus.paid);

        return List.of(
                SalesPerformanceResponse.builder()
                        .label("Total Orders")
                        .value(String.valueOf(currentOrders))
                        .change(formatPercentageChange(BigDecimal.valueOf(currentOrders), BigDecimal.valueOf(previousOrders)))
                        .icon("shopping-bag")
                        .color("indigo")
                        .build(),
                SalesPerformanceResponse.builder()
                        .label("Total Sales")
                        .value(currentSales.setScale(2, RoundingMode.HALF_UP).toString())
                        .change(formatPercentageChange(currentSales, previousSales))
                        .icon("shield-check")
                        .color("success")
                        .build());
    }

    private String formatPercentageChange(BigDecimal current, BigDecimal previous) {
        if (previous == null || BigDecimal.ZERO.compareTo(previous) == 0) {
            return current.compareTo(BigDecimal.ZERO) > 0 ? "+100.0%" : "0.0%";
        }
        BigDecimal change = current.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
        return (change.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "") + change.setScale(1, RoundingMode.HALF_UP) + "%";
    }

    private LocalDate convertToLocalDate(Object value) {
        if (value instanceof java.sql.Date date) {
            return date.toLocalDate();
        }
        if (value instanceof LocalDate localDate) {
            return localDate;
        }
        if (value instanceof java.sql.Timestamp timestamp) {
            return timestamp.toLocalDateTime().toLocalDate();
        }
        throw new IllegalArgumentException("Unsupported date type: " + (value != null ? value.getClass() : "null"));
    }

    private List<DatePointResponse> fillMissingDatePoints(LocalDate fromDate, LocalDate toDate,
            Map<LocalDate, BigDecimal> data) {
        LocalDate current = fromDate;
        List<DatePointResponse> result = new java.util.ArrayList<>();
        while (!current.isAfter(toDate)) {
            BigDecimal value = data.getOrDefault(current, BigDecimal.ZERO);
            result.add(DatePointResponse.builder()
                    .label(current.format(DATE_LABEL_FORMATTER))
                    .value(value)
                    .build());
            current = current.plusDays(1);
        }
        return result;
    }

}
