package com.pos.backend.service.Dashboard.metrics;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.pos.backend.constant.enums.OrderStatus;
import com.pos.backend.dto.response.Dashboard.UserStatisticsResponse;
import com.pos.backend.entity.User;
import com.pos.backend.repository.OrderRepository;
import com.pos.backend.repository.UserRepository;
import com.pos.backend.util.DateRangeUtils;
import com.pos.backend.util.DateRangeUtils.Period;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserMetricProviderImpl implements UserMetricProvider {

    static final int AVATAR_LIMIT = 5;
    static final int TOP_USER_LIMIT = 1;

    UserRepository userRepository;
    OrderRepository orderRepository;

    @Override
    public UserStatisticsResponse getUserStatistics(LocalDateTime fromDate, LocalDateTime toDate) {
        TopUserResult topUser = resolveTopUser(fromDate, toDate);
        long currentPeriodUsers = userRepository.countByCreatedAtBetween(fromDate, toDate);
        String newUsersChange = calculateNewUsersChange(currentPeriodUsers, fromDate, toDate);
        List<UserStatisticsResponse.AvatarStackResponse> avatars = resolveNewUserAvatars(fromDate, toDate);
        List<UserStatisticsResponse.ChartPoint> chartData = resolveNewUsersChart(fromDate, toDate);

        return UserStatisticsResponse.builder()
                .topUserName(topUser.name())
                .topUserAvatarUrl(topUser.avatarUrl())
                .grandTotal(topUser.grandTotal())
                .totalNewUsers(String.valueOf(currentPeriodUsers))
                .newUsersChange(newUsersChange)
                .newUserAvatars(avatars)
                .newUsersChart(chartData)
                .build();
    }

    private TopUserResult resolveTopUser(LocalDateTime fromDate, LocalDateTime toDate) {
        Page<Object[]> page = orderRepository.findTopUserBySalesInRange(fromDate, toDate, OrderStatus.completed,
                PageRequest.of(0, TOP_USER_LIMIT));

        if (page.hasContent()) {
            Object[] row = page.getContent().get(0);
            String firstName = (String) row[0];
            String lastName = (String) row[1];
            String avatarUrl = (String) row[2];
            BigDecimal revenue = (BigDecimal) row[3];

            return new TopUserResult(
                    firstName + " " + lastName,
                    avatarUrl,
                    "$" + revenue.setScale(2, RoundingMode.HALF_UP).toString());
        }

        return new TopUserResult("N/A", null, "$0.00");
    }

    private String calculateNewUsersChange(long currentPeriodUsers, LocalDateTime fromDate, LocalDateTime toDate) {
        Period previousPeriod = DateRangeUtils.resolvePreviousPeriod(fromDate, toDate);
        long previousPeriodUsers = userRepository.countByCreatedAtBetween(
                previousPeriod.fromDate(),
                previousPeriod.toDate());

        if (previousPeriodUsers == 0) {
            return currentPeriodUsers > 0 ? "+100.0%" : "0.0%";
        }

        double change = ((double) (currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers) * 100;
        return (change >= 0 ? "+" : "") + String.format("%.1f%%", change);
    }

    private List<UserStatisticsResponse.AvatarStackResponse> resolveNewUserAvatars(LocalDateTime fromDate,
            LocalDateTime toDate) {
        Page<User> page = userRepository.findByCreatedAtBetween(fromDate, toDate,
                PageRequest.of(0, AVATAR_LIMIT, Sort.by("createdAt").descending()));

        return page.getContent().stream()
                .map(user -> UserStatisticsResponse.AvatarStackResponse.builder()
                        .id(user.getId())
                        .imageUrl(user.getAvatarPath())
                        .alt(user.getFirstName())
                        .build())
                .toList();
    }

    private List<UserStatisticsResponse.ChartPoint> resolveNewUsersChart(LocalDateTime fromDate, LocalDateTime toDate) {
        List<Object[]> rows = userRepository.countUsersGroupedByDate(fromDate, toDate);
        return rows.stream()
                .map(row -> UserStatisticsResponse.ChartPoint.builder()
                        .label(String.valueOf(row[0]))
                        .value((Long) row[1])
                        .build())
                .toList();
    }

    private record TopUserResult(String name, String avatarUrl, String grandTotal) {
    }
}
