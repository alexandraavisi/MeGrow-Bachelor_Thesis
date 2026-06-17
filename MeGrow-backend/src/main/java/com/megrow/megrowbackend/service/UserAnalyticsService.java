package com.megrow.megrowbackend.service;

import com.megrow.megrowbackend.dto.response.GoalProgressResponse;
import com.megrow.megrowbackend.dto.response.UserAnalyticsResponse;
import com.megrow.megrowbackend.entities.Goal;
import com.megrow.megrowbackend.entities.Task;
import com.megrow.megrowbackend.entities.User;
import com.megrow.megrowbackend.enums.GoalStatus;
import com.megrow.megrowbackend.enums.TaskStatus;
import com.megrow.megrowbackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserAnalyticsService {
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final GoalRepository goalRepository;
    private final GoalBacklogItemRepository goalBacklogItemRepository;
    private final TaskTimeSessionRepository taskTimeSessionRepository;

    public UserAnalyticsResponse getAnalytics() {
        User user = getCurrentUser();

        List<Task> completedTasks = taskRepository.findByUserIdAndStatus(
                user.getId(), TaskStatus.DONE);

        int totalTasksCompleted = completedTasks.size();

        int totalGoalsCompleted = goalRepository.countByUserIdAndStatus(
                user.getId(), GoalStatus.COMPLETED);

        long totalMinutesInvested = taskTimeSessionRepository
                .sumDurationSecondsByUserId(user.getId()) / 60;

        String mostProductiveDay = calculateMostProductiveDay(completedTasks);

        List<Goal> activeGoals = goalRepository.findByUserIdAndStatus(
                user.getId(), GoalStatus.ACTIVE);

        List<GoalProgressResponse> goalsProgress = activeGoals.stream()
                .map(this::calculateGoalProgress)
                .collect(Collectors.toList());

        return new UserAnalyticsResponse(
                totalTasksCompleted,
                totalGoalsCompleted,
                totalMinutesInvested,
                mostProductiveDay,
                goalsProgress
        );
    }

    private String calculateMostProductiveDay(List<Task> completedTasks) {
        Map<DayOfWeek, Long> countByDay = completedTasks.stream()
                .filter(t -> t.getCompletedAt() != null)
                .collect(Collectors.groupingBy(
                        t -> t.getCompletedAt().getDayOfWeek(),
                        Collectors.counting()
                ));

        return countByDay.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(entry -> entry.getKey().getDisplayName(TextStyle.FULL, Locale.ENGLISH))
                .orElse("Not enough data");
    }

    private GoalProgressResponse calculateGoalProgress(Goal goal) {
        long totalItems = goalBacklogItemRepository.countByGoalId(goal.getId());
        long completedItems = goalBacklogItemRepository.countByGoalIdAndIsCompletedTrue(goal.getId());

        double progress = totalItems > 0
                ? (double) completedItems / totalItems * 100
                : 0;

        return new GoalProgressResponse(
                goal.getId(),
                goal.getTitle(),
                goal.getCategory().toString(),
                (int) totalItems,
                (int) completedItems,
                Math.round(progress * 10) / 10.0
        );
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
