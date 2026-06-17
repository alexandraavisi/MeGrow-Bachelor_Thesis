package com.megrow.megrowbackend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class UserAnalyticsResponse {
    private int totalTasksCompleted;
    private int totalGoalsCompleted;
    private long totalMinutesInvested;
    private String mostProductiveDay;
    private List<GoalProgressResponse> goalsProgress;
}
