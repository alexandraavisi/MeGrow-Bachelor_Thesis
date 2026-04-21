package com.megrow.megrowbackend.service;

import com.megrow.megrowbackend.dto.request.CreateGoalRequest;
import com.megrow.megrowbackend.dto.response.GoalResponse;
import com.megrow.megrowbackend.entities.*;
import com.megrow.megrowbackend.enums.GoalCategory;
import com.megrow.megrowbackend.enums.GoalStatus;
import com.megrow.megrowbackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;
    private final GoalFitnessDetailsRepository goalFitnessDetailsRepository;
    private final UserRepository userRepository;
    private final AiBacklogService aiBacklogService;
    private final GoalBacklogItemRepository goalBacklogItemRepository;
    private final UserProfileRepository userProfileRepository;

    @Transactional
    public GoalResponse createGoal(CreateGoalRequest request){
        User user = getCurrentUser();

        int activeGoals = goalRepository.countByUserIdAndStatus(user.getId(), GoalStatus.ACTIVE);
        if (activeGoals >= 3)
            throw new RuntimeException("Maximum 3 active goals allowed");

        if (request.getCategory() == GoalCategory.FITNESS) {
            if (request.getFitnessType() == null) {
                throw new RuntimeException("Fitness type is required for FITNESS goals");
            }
            if (request.getIsPhysicallyActive() == null) {
                throw new RuntimeException("Physically activity status is required for FITNESS goals");
            }
        } else {
            if (request.getLevel() == null) {
                throw new RuntimeException("Level is required for LEARNING and LANGUAGE goals");
            }
        }

        Goal goal = Goal.builder()
                .user(user)
                .category(request.getCategory())
                .title(request.getTitle())
                .description(request.getDescription())
                .motivation(request.getMotivation())
                .level(request.getLevel())
                .durationWeeks(request.getDurationWeeks())
                .status(GoalStatus.ACTIVE)
                .build();
        goalRepository.save(goal);

        UserProfile profile = userProfileRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        List<GoalBacklogItem> backlogItems = aiBacklogService.generateBacklog(goal, profile);
        backlogItems.forEach(goalBacklogItemRepository::save);

        GoalFitnessDetails fitnessDetails = null;
        if (request.getCategory() == GoalCategory.FITNESS) {
            fitnessDetails = GoalFitnessDetails.builder()
                    .goal(goal)
                    .fitnessType(request.getFitnessType())
                    .isPhysicallyActive(request.getIsPhysicallyActive())
                    .build();
            goalFitnessDetailsRepository.save(fitnessDetails);
        }

        return mapToResponse(goal, fitnessDetails);
    }

    public List<GoalResponse> getGoals() {
        User user = getCurrentUser();
        return goalRepository.findByUserId(user.getId())
                .stream()
                .map(goal -> {
                    GoalFitnessDetails fitnessDetails = goal.getCategory() == GoalCategory.FITNESS
                            ? goalFitnessDetailsRepository.findById(goal.getId()).orElse(null)
                            : null;
                    return mapToResponse(goal, fitnessDetails);
                }).collect(Collectors.toList());
    }

    public GoalResponse getGoalById(UUID id) {
        User user = getCurrentUser();
        Goal goal = goalRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Goal not found"));

        if (!goal.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        GoalFitnessDetails fitnessDetails = goal.getCategory() == GoalCategory.FITNESS
                ? goalFitnessDetailsRepository.findById(goal.getId()).orElse(null)
                : null;

        return mapToResponse(goal, fitnessDetails);
    }

    @Transactional
    public  GoalResponse updateGoalStatus(UUID id, GoalStatus status) {
        User user = getCurrentUser();
        Goal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        if (!goal.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        goal.setStatus(status);
        goalRepository.save(goal);

        GoalFitnessDetails fitnessDetails = goal.getCategory() == GoalCategory.FITNESS
                ? goalFitnessDetailsRepository.findById(goal.getId()).orElse(null)
                : null;

        return mapToResponse(goal, fitnessDetails);
    }

    private GoalResponse mapToResponse(Goal goal, GoalFitnessDetails fitnessDetails) {
        return new  GoalResponse(
                goal.getId(),
                goal.getCategory(),
                goal.getTitle(),
                goal.getDescription(),
                goal.getMotivation(),
                goal.getLevel(),
                goal.getDurationWeeks(),
                goal.getStatus(),
                goal.getCreatedAt(),
                fitnessDetails != null ? fitnessDetails.getFitnessType() : null,
                fitnessDetails != null ? fitnessDetails.isPhysicallyActive() : null
        );
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
