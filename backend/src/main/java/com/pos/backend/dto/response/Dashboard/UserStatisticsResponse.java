package com.pos.backend.dto.response.Dashboard;

import java.util.List;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserStatisticsResponse {

    private String topUserName;
    private String topUserAvatarUrl;
    private String grandTotal;
    private String totalNewUsers;
    private String newUsersChange;
    private List<AvatarStackResponse> newUserAvatars;
    private List<ChartPoint> newUsersChart;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class AvatarStackResponse {
        private long id;
        private String imageUrl;
        private String alt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class ChartPoint {
        private String label;
        private long value;
    }
}
