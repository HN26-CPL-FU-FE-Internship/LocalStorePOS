package com.pos.backend.service.Dashboard;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.dto.request.Dashboard.DashboardFilterRequest;
import com.pos.backend.dto.response.Dashboard.ActiveOrderResponse;
import com.pos.backend.dto.response.Dashboard.ActivityLogResponse;
import com.pos.backend.dto.response.Dashboard.CategoryStatResponse;
import com.pos.backend.dto.response.Dashboard.DashboardStatsResponse;
import com.pos.backend.dto.response.Dashboard.DatePointResponse;
import com.pos.backend.dto.response.Dashboard.ReservationResponse;
import com.pos.backend.dto.response.Dashboard.SalesPerformanceResponse;
import com.pos.backend.dto.response.Dashboard.TableAvailabilityResponse;
import com.pos.backend.dto.response.Dashboard.TopSellingItemResponse;
import com.pos.backend.dto.response.Dashboard.TrendingMenuResponse;
import com.pos.backend.dto.response.Dashboard.UserStatisticsResponse;
import com.pos.backend.service.Dashboard.metrics.InventoryMetricProvider;
import com.pos.backend.service.Dashboard.metrics.NotificationMetricProvider;
import com.pos.backend.service.Dashboard.metrics.OrderMetricProvider;
import com.pos.backend.service.Dashboard.metrics.ReservationMetricProvider;
import com.pos.backend.service.Dashboard.metrics.SalesMetricProvider;
import com.pos.backend.service.Dashboard.metrics.TableMetricProvider;
import com.pos.backend.service.Dashboard.metrics.UserMetricProvider;
import com.pos.backend.util.LocalDateTimeUtil;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DashboardServiceImpl implements DashboardService {

    static final int DEFAULT_LIMIT = 5;

    OrderMetricProvider orderMetricProvider;
    SalesMetricProvider salesMetricProvider;
    InventoryMetricProvider inventoryMetricProvider;
    ReservationMetricProvider reservationMetricProvider;
    TableMetricProvider tableMetricProvider;
    NotificationMetricProvider notificationMetricProvider;
    UserMetricProvider userMetricProvider;

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats(DashboardFilterRequest filter) {
        DateRange range = resolveDateRange(filter);

        DashboardStatsResponse stats = new DashboardStatsResponse();
        orderMetricProvider.fillOrderStats(stats, range.fromDate(), range.toDate());
        salesMetricProvider.fillSalesStats(stats, range.fromDate(), range.toDate());
        stats.setTotalReservations(reservationMetricProvider.countReservations(range.fromDate(), range.toDate()));

        return stats;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DatePointResponse> getRevenueChart(DashboardFilterRequest filter) {
        DateRange range = resolveDateRange(filter);
        return salesMetricProvider.getRevenueChart(range.fromDate(), range.toDate());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopSellingItemResponse> getTopSellingItems(DashboardFilterRequest filter, int limit) {
        DateRange range = resolveDateRange(filter);
        return inventoryMetricProvider.getTopSellingItems(range.fromDate(), range.toDate(), limit);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryStatResponse> getCategoryStats(DashboardFilterRequest filter) {
        DateRange range = resolveDateRange(filter);
        return inventoryMetricProvider.getCategoryStats(range.fromDate(), range.toDate());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActiveOrderResponse> getActiveOrders(int limit) {
        return orderMetricProvider.getActiveOrders(limit);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalesPerformanceResponse> getSalesPerformance(DashboardFilterRequest filter) {
        DateRange range = resolveDateRange(filter);
        return salesMetricProvider.getSalesPerformance(range.fromDate(), range.toDate());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TrendingMenuResponse> getTrendingMenus(DashboardFilterRequest filter, int limit) {
        DateRange range = resolveDateRange(filter);
        return inventoryMetricProvider.getTrendingMenus(range.fromDate(), range.toDate(), limit);
    }

    @Override
    @Transactional(readOnly = true)
    public UserStatisticsResponse getUserStatistics(DashboardFilterRequest filter) {
        DateRange range = resolveDateRange(filter);
        return userMetricProvider.getUserStatistics(range.fromDate(), range.toDate());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponse> getReservations(int limit) {
        LocalDateTime now = LocalDateTimeUtil.getTimeNow();
        return reservationMetricProvider.getUpcomingReservations(now, now.plusDays(30), limit);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TableAvailabilityResponse> getAvailableTables(int limit) {
        return tableMetricProvider.getAvailableTables(limit);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getRecentActivityLogs(DashboardFilterRequest filter, int limit) {
        DateRange range = resolveDateRange(filter);
        return notificationMetricProvider.getRecentActivityLogs(range.fromDate(), range.toDate(), limit);
    }

    private DateRange resolveDateRange(DashboardFilterRequest filter) {
        LocalDate from = Optional.ofNullable(filter.getFromDate()).orElseGet(() -> LocalDate.now().withDayOfMonth(1));
        LocalDate to = Optional.ofNullable(filter.getToDate()).orElseGet(() -> LocalDate.now());
        return new DateRange(from.atStartOfDay(), LocalDateTime.of(to, LocalTime.MAX));
    }

    private record DateRange(LocalDateTime fromDate, LocalDateTime toDate) {
    }
}
