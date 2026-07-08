package com.megrow.megrowbackend.controller;

import com.megrow.megrowbackend.dto.response.DailyPlanResponse;
import com.megrow.megrowbackend.dto.response.UserStatsResponse;
import com.megrow.megrowbackend.entities.Task;
import com.megrow.megrowbackend.entities.User;
import com.megrow.megrowbackend.entities.UserStats;
import com.megrow.megrowbackend.enums.TaskSource;
import com.megrow.megrowbackend.repository.DailyPlanRepository;
import com.megrow.megrowbackend.repository.SurpriseTaskOptionRepository;
import com.megrow.megrowbackend.repository.TaskRepository;
import com.megrow.megrowbackend.repository.UserRepository;
import com.megrow.megrowbackend.repository.UserStatsRepository;
import com.megrow.megrowbackend.service.DailyPlanService;
import com.megrow.megrowbackend.service.UserStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/demo")
@RequiredArgsConstructor
public class DemoController {

    private final UserRepository userRepository;
    private final UserStatsRepository userStatsRepository;
    private final UserStatsService userStatsService;
    private final DailyPlanService dailyPlanService;
    private final DailyPlanRepository dailyPlanRepository;
    private final TaskRepository taskRepository;
    private final SurpriseTaskOptionRepository surpriseTaskOptionRepository;

    @PostMapping("/rescue-mode/simulate")
    public ResponseEntity<UserStatsResponse> simulateInactivity(
            @RequestParam(defaultValue = "3") int daysAgo) {
        User user = getCurrentUser();
        UserStats stats = userStatsRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Stats not found"));


        stats.setLastActivityDate(LocalDate.now().minusDays(daysAgo));
        stats.setRescueModeSince(null);
        userStatsRepository.save(stats);

        userStatsService.checkAndActivateRescueMode(user);

        UserStats updated = userStatsRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Stats not found"));

        return ResponseEntity.ok(new UserStatsResponse(
                updated.getXpTotal(),
                updated.getLevel(),
                updated.getTreeHealth(),
                updated.getStreakDays(),
                updated.getLastActivityDate(),
                updated.getRescueModeSince() != null,
                updated.getFlowerResetXp()
        ));
    }

    @PostMapping("/daily-plan/generate")
    public ResponseEntity<DailyPlanResponse> generatePlanNow(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        User user = getCurrentUser();
        LocalDate targetDate = date != null ? date : LocalDate.now().plusDays(1);

        dailyPlanRepository.findByUserIdAndPlanDate(user.getId(), targetDate)
                .ifPresent(dailyPlanRepository::delete);

        List<Task> priorAiTasks = taskRepository.findByUserIdAndScheduledDateAndSource(
                user.getId(), targetDate, TaskSource.GOAL_GENERATED);
        for (Task task : priorAiTasks) {
            surpriseTaskOptionRepository.deleteByTaskId(task.getId());
        }
        taskRepository.deleteAll(priorAiTasks);

        DailyPlanResponse plan = dailyPlanService.generatePlan(user, targetDate);
        return ResponseEntity.ok(plan);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
