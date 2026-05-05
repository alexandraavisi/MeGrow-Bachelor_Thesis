package com.megrow.megrowbackend.service;

import com.megrow.megrowbackend.dto.response.DailyPlanResponse;
import com.megrow.megrowbackend.dto.response.TaskResponse;
import com.megrow.megrowbackend.entities.*;
import com.megrow.megrowbackend.enums.*;
import com.megrow.megrowbackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DailyPlanService {

    private final DailyPlanRepository dailyPlanRepository;
    private final TaskRepository taskRepository;
    private final GoalRepository goalRepository;
    private final GoalBacklogItemRepository goalBacklogItemRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserStatsService userStatsService;
    private final SurpriseTaskOptionRepository surpriseTaskOptionRepository;

    @Transactional
    public DailyPlanResponse getTodayPlan() {
        User user = getCurrentUser();
        LocalDate today = LocalDate.now();

        Optional<DailyPlan> existingPlan = dailyPlanRepository
                .findByUserIdAndPlanDate(user.getId(), today);

        if (existingPlan.isPresent()) {
            return mapToResponse(existingPlan.get(), user);
        }

        return generatePlan(user, today);
    }

    @Transactional
    public DailyPlanResponse generatePlan(User user, LocalDate date) {
        UserProfile profile = userProfileRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        Archetype archetype = profile.getFinalArchetype();
        boolean gentleMode = profile.isGentleMode();
        boolean rescueMode = userStatsService.isInRescueMode(user);

        int manualMinutes = taskRepository.sumEstimatedMinutesForDay(user.getId(), date);

        List<Goal> activeGoals = goalRepository.findByUserIdAndStatus(
                user.getId(), GoalStatus.ACTIVE);

        int totalMinutes = manualMinutes;

        int taskPerGoal = getTasksPerGoal(gentleMode, rescueMode, OverloadLevel.NONE);

        for  (Goal goal : activeGoals) {
            OverloadLevel currentOverload = calculateOverloadLevel(totalMinutes);
            taskPerGoal = getTasksPerGoal(gentleMode, rescueMode, currentOverload);

            List<GoalBacklogItem> pendingItems = goalBacklogItemRepository
                    .findByGoalIdOrderByOrderIndexAsc(goal.getId())
                    .stream()
                    .filter(item -> !item.isCompleted())
                    .limit(taskPerGoal + (archetype == Archetype.EXPLORER ? 1 : 0))
                    .collect(Collectors.toList());

            if (archetype == Archetype.EXPLORER && pendingItems.size() >= 2) {
                Difficulty difficulty = mapDifficulty(user, archetype, gentleMode, rescueMode);

                Task surpriseTask = Task.builder()
                        .user(user)
                        .goal(goal)
                        .source(TaskSource.GOAL_GENERATED)
                        .title("Surprise Task")
                        .difficulty(difficulty)
                        .estimatedMinutes(pendingItems.get(0).getEstimatedMinutes())
                        .scheduledDate(date)
                        .status(TaskStatus.TODO)
                        .isSurprise(true)
                        .build();
                taskRepository.save(surpriseTask);

                SurpriseTaskOption option1 = SurpriseTaskOption.builder().
                        task(surpriseTask)
                        .backlogItem(pendingItems.get(0))
                        .build();

                SurpriseTaskOption option2 = SurpriseTaskOption.builder()
                        .task(surpriseTask)
                        .backlogItem(pendingItems.get(1))
                        .build();
                surpriseTaskOptionRepository.save(option1);
                surpriseTaskOptionRepository.save(option2);
                totalMinutes += surpriseTask.getEstimatedMinutes();

                for (int i = 2; i < pendingItems.size(); i++) {
                    GoalBacklogItem item = pendingItems.get(i);
                    Task task = Task.builder()
                            .user(user)
                            .goal(goal)
                            .backlogItem(item)
                            .source(TaskSource.GOAL_GENERATED)
                            .title(item.getTitle())
                            .difficulty(difficulty)
                            .estimatedMinutes(item.getEstimatedMinutes())
                            .scheduledDate(date)
                            .status(TaskStatus.TODO)
                            .build();
                    taskRepository.save(task);
                    totalMinutes += task.getEstimatedMinutes();
                }
            } else {

                for (GoalBacklogItem item : pendingItems) {
                    Difficulty difficulty = mapDifficulty(user, archetype, gentleMode, rescueMode);

                    Task task = Task.builder()
                            .user(user)
                            .goal(goal)
                            .backlogItem(item)
                            .source(TaskSource.GOAL_GENERATED)
                            .title(item.getTitle())
                            .difficulty(difficulty)
                            .estimatedMinutes(item.getEstimatedMinutes())
                            .scheduledDate(date)
                            .status(TaskStatus.TODO)
                            .build();

                    taskRepository.save(task);
                    totalMinutes += item.getEstimatedMinutes();
                }
            }

        }

        OverloadLevel overloadLevel = calculateOverloadLevel(totalMinutes);

        DailyPlan plan = DailyPlan.builder()
                .user(user)
                .planDate(date)
                .totalEstimatedMinutes((short) totalMinutes)
                .overloadLevel(overloadLevel)
                .build();

        dailyPlanRepository.save(plan);
        return mapToResponse(plan, user);
    }

    private int getTasksPerGoal(boolean gentleMode,boolean rescueMode, OverloadLevel overloadLevel) {
        if (rescueMode) return 1;
        if (overloadLevel == OverloadLevel.CRITICAL) return 1;
        if (overloadLevel == OverloadLevel.MODERATE) return gentleMode ? 1 : 2;
        return gentleMode ? 2 : 3;
    }

    private Difficulty mapDifficulty(User user, Archetype archetype, boolean gentleMode, boolean rescueMode) {
        if (rescueMode) return Difficulty.EASY;

        Difficulty baseDifficulty = switch (archetype) {
            case ACHIEVER -> gentleMode ? Difficulty.MEDIUM : Difficulty.HARD;
            case PLANNER -> gentleMode ? Difficulty.EASY : Difficulty.MEDIUM;
            case EXPLORER -> gentleMode ? Difficulty.EASY : Difficulty.MEDIUM;
        };

        return userStatsService.adjustDifficulty(user, baseDifficulty);
    }

    private OverloadLevel calculateOverloadLevel(int totalMinutes) {
        if (totalMinutes >= 240) return OverloadLevel.CRITICAL;
        if (totalMinutes >= 180) return OverloadLevel.MODERATE;
        return OverloadLevel.NONE;
    }

    @Transactional
    public DailyPlanResponse regeneratePlan() {
        User user = getCurrentUser();
        LocalDate today = LocalDate.now();

        dailyPlanRepository.findByUserIdAndPlanDate(user.getId(), today)
                .ifPresent(dailyPlanRepository::delete);

        return generatePlan(user, today);
    }

    private DailyPlanResponse mapToResponse(DailyPlan plan, User user) {
        List<TaskResponse> tasks = taskRepository
                .findByUserIdAndScheduledDateAndParentTaskIsNull(user.getId(), plan.getPlanDate())
                .stream()
                .map(task -> new TaskResponse(
                        task.getId(),
                        task.getTitle(),
                        task.getDescription(),
                        task.getSource(),
                        task.getStatus(),
                        task.getPriority(),
                        task.getDifficulty(),
                        task.getEstimatedMinutes(),
                        task.getScheduledDate(),
                        task.getDeadlineAt(),
                        task.getStartedAt(),
                        task.getCompletedAt(),
                        task.getCreatedAt(),
                        task.getParentTask() != null ? task.getParentTask().getId() : null,
                        task.getGoal() != null  ? task.getGoal().getId() : null,
                        task.isSurprise()
                )).collect(Collectors.toList());

        return new DailyPlanResponse(
                plan.getId(),
                plan.getPlanDate(),
                plan.getOverloadLevel(),
                plan.getTotalEstimatedMinutes(),
                tasks
        );
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}