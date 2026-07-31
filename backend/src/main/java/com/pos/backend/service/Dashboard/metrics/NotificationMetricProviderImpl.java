package com.pos.backend.service.Dashboard.metrics;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.pos.backend.dto.response.Dashboard.ActivityLogResponse;
import com.pos.backend.entity.AuditLog;
import com.pos.backend.repository.AuditLogRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationMetricProviderImpl implements NotificationMetricProvider {

    static final Map<String, String> ACTION_ICONS = Map.of(
            "ORDER", "shopping-cart",
            "PAYMENT", "badge-dollar-sign",
            "DISCOUNT", "diamond-percent",
            "SYSTEM", "info");

    AuditLogRepository auditLogRepository;

    @Override
    public List<ActivityLogResponse> getRecentActivityLogs(LocalDateTime fromDate, LocalDateTime toDate, int limit) {
        List<AuditLog> logs = auditLogRepository.findTop20ByCreatedAtBetweenOrderByCreatedAtDesc(fromDate, toDate);
        List<LogEntry> entries = logs.stream()
                .limit(limit)
                .map(this::toLogEntry)
                .toList();

        if (entries.isEmpty()) {
            return List.of();
        }

        return groupByRelativeTime(entries);
    }

    private List<ActivityLogResponse> groupByRelativeTime(List<LogEntry> entries) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();
        LocalDateTime yesterdayStart = todayStart.minusDays(1);

        List<ActivityLogResponse.ActivityLogItemResponse> todayItems = new java.util.ArrayList<>();
        List<ActivityLogResponse.ActivityLogItemResponse> yesterdayItems = new java.util.ArrayList<>();
        List<ActivityLogResponse.ActivityLogItemResponse> earlierItems = new java.util.ArrayList<>();

        for (LogEntry entry : entries) {
            LocalDateTime createdAt = entry.createdAt();
            if (createdAt == null || createdAt.isBefore(yesterdayStart)) {
                earlierItems.add(entry.item());
            } else if (createdAt.isBefore(todayStart)) {
                yesterdayItems.add(entry.item());
            } else {
                todayItems.add(entry.item());
            }
        }

        List<ActivityLogResponse> result = new java.util.ArrayList<>();
        if (!todayItems.isEmpty()) {
            result.add(ActivityLogResponse.builder().heading("Today").items(todayItems).build());
        }
        if (!yesterdayItems.isEmpty()) {
            result.add(ActivityLogResponse.builder().heading("Yesterday").items(yesterdayItems).build());
        }
        if (!earlierItems.isEmpty()) {
            result.add(ActivityLogResponse.builder().heading("Earlier").items(earlierItems).build());
        }
        return result;
    }

    private LogEntry toLogEntry(AuditLog log) {
        return new LogEntry(log.getCreatedAt(), toActivityLogItem(log));
    }

    private record LogEntry(LocalDateTime createdAt, ActivityLogResponse.ActivityLogItemResponse item) {
    }

    private ActivityLogResponse.ActivityLogItemResponse toActivityLogItem(AuditLog log) {
        String module = Optional.ofNullable(log.getModule()).orElse("SYSTEM").toUpperCase();
        String icon = ACTION_ICONS.getOrDefault(module, "info");

        return ActivityLogResponse.ActivityLogItemResponse.builder()
                .id(String.valueOf(log.getId()))
                .icon(icon)
                .color("primary")
                .message(Optional.ofNullable(log.getDescription()).orElse("No description"))
                .time(formatRelativeTime(log.getCreatedAt()))
                .build();
    }

    private String formatRelativeTime(LocalDateTime createdAt) {
        if (createdAt == null) {
            return "Unknown";
        }

        long minutes = ChronoUnit.MINUTES.between(createdAt, LocalDateTime.now());
        if (minutes < 60) {
            return minutes + " min ago";
        }
        long hours = ChronoUnit.HOURS.between(createdAt, LocalDateTime.now());
        if (hours < 24) {
            return hours + " hrs ago";
        }
        long days = ChronoUnit.DAYS.between(createdAt, LocalDateTime.now());
        return days + " days ago";
    }
}
