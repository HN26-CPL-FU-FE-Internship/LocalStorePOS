package com.pos.backend.util;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/**
 * Utility class for common date-range calculations used in dashboard metrics.
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class DateRangeUtils {

    /**
     * Resolves the previous period that mirrors the current period [fromDate, toDate].
     *
     * <p>For whole-day ranges (where {@code toDate} ends at {@link LocalTime#MAX}), the
     * previous period has the same number of whole days shifted backwards, e.g.
     * {@code [2024-07-01, 2024-07-31] -> [2024-06-01, 2024-06-30]}.</p>
     *
     * <p>For arbitrary time ranges, the previous period has the exact same duration and
     * ends one nanosecond before {@code fromDate} to avoid overlap.</p>
     *
     * @param fromDate start of the current period (inclusive)
     * @param toDate   end of the current period (inclusive)
     * @return a {@link Period} representing the previous period
     * @throws IllegalArgumentException if either argument is null, or if {@code toDate}
     *                                  is before {@code fromDate}
     */
    public static Period resolvePreviousPeriod(LocalDateTime fromDate, LocalDateTime toDate) {
        if (fromDate == null || toDate == null) {
            throw new IllegalArgumentException("fromDate and toDate must not be null");
        }
        if (toDate.isBefore(fromDate)) {
            throw new IllegalArgumentException("toDate must not be before fromDate");
        }

        LocalDateTime previousToDate = fromDate.minusNanos(1);
        LocalDateTime previousFromDate;

        if (toDate.toLocalTime().equals(LocalTime.MAX)) {
            long days = ChronoUnit.DAYS.between(fromDate.toLocalDate(), toDate.toLocalDate()) + 1;
            previousFromDate = fromDate.minusDays(days);
        } else {
            Duration duration = Duration.between(fromDate, toDate);
            if (duration.isZero()) {
                duration = Duration.ofSeconds(1);
            }
            previousFromDate = previousToDate.minus(duration);
        }

        return new Period(previousFromDate, previousToDate);
    }

    /**
     * Represents a date-time period with inclusive start and end points.
     */
    public record Period(LocalDateTime fromDate, LocalDateTime toDate) {
    }
}
