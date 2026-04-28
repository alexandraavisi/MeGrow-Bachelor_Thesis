package com.megrow.megrowbackend.config;

import com.megrow.megrowbackend.entities.User;
import com.megrow.megrowbackend.repository.UserRepository;
import com.megrow.megrowbackend.service.DailyPlanService;
import com.megrow.megrowbackend.service.UserStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DailyPlanScheduler {
    private final DailyPlanService dailyPlanService;
    private final UserStatsService userStatsService;
    private final UserRepository userRepository;

    @Scheduled(cron = "0 0 6 * * *")
    public void generateDailyPlans() {
        List<User> users = userRepository.findAll();

        for (User user : users) {
            try {
                dailyPlanService.generatePlan(user, LocalDate.now());
            } catch (Exception e) {
                System.err.println("Error generating plan for user: " + user.getId());
            }
        }
    }

    @Scheduled(cron = "0 0 0 * * *")
    public void decreaseTreeHealth() {
        List<User> users = userRepository.findAll();

        for (User user : users) {
            try {
                userStatsService.checkAndActivateRescueMode(user);
            } catch (Exception e) {
                System.err.println("Error processing health decay for user: " + user.getId());
            }
        }
    }
}
