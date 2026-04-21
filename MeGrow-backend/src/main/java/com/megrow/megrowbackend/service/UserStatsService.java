package com.megrow.megrowbackend.service;

import com.megrow.megrowbackend.entities.Task;
import com.megrow.megrowbackend.entities.User;
import com.megrow.megrowbackend.entities.UserStats;
import com.megrow.megrowbackend.enums.TaskSource;
import com.megrow.megrowbackend.repository.UserStatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class UserStatsService {
    private final UserStatsRepository userStatsRepository;

    @Transactional
    public void recordActivity(User user) {
        UserStats stats = userStatsRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDate today = LocalDate.now();
        LocalDate lastActivity = stats.getLastActivityDate();

        if (lastActivity != null && lastActivity.plusDays(1).equals(today)) {
            stats.setStreakDays((short) (stats.getStreakDays() + 1));
        } else if (lastActivity == null || !lastActivity.equals(today)) {
            stats.setStreakDays((short) 1);
        }

        stats.setLastActivityDate(today);

        if (stats.getRescueModeSince() != null) {
            stats.setRescueModeSince(null);
        }

        userStatsRepository.save(stats);
    }

    @Transactional
    public void awardXPForTasks(User user, Task task) {
        UserStats stats = userStatsRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        int xp = task.getSource() == TaskSource.GOAL_GENERATED ? 20 : 10;

        //bonus streak
        if (stats.getStreakDays() >= 7) {
            xp += 5;
        }

        stats.setXpTotal(stats.getXpTotal() + xp);
        stats.setLevel(calculatedLevel(stats.getXpTotal()));

        //tree health
        if (task.getSource() == TaskSource.GOAL_GENERATED) {
            short newHealth = (short) Math.min(100, stats.getTreeHealth() + 5);
            stats.setTreeHealth(newHealth);
        }

        userStatsRepository.save(stats);
        recordActivity(user);
    }

    @Transactional
    public void awardHealthForHabit(User user) {
        UserStats stats = userStatsRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Stats not found"));

        short newHealth = (short) Math.min(100, stats.getTreeHealth() + 3);
        stats.setTreeHealth(newHealth);

        userStatsRepository.save(stats);
        recordActivity(user);
    }

    @Transactional
    public void checkAndActivateRescueMode(User user) {
        UserStats stats = userStatsRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Stats not found"));

        if (stats.getLastActivityDate() == null) return;

        long daysSinceActivity = java.time.temporal.ChronoUnit.DAYS.between(stats.getLastActivityDate(), LocalDate.now());

        if (daysSinceActivity >= 3 && stats.getRescueModeSince() == null) {
            stats.setRescueModeSince(LocalDate.now());
            userStatsRepository.save(stats);
        }

        if (daysSinceActivity >= 1) {
            short healthLoss = (short) Math.min(stats.getTreeHealth(),
                    daysSinceActivity * 3);
            stats.setTreeHealth((short) (stats.getTreeHealth() - healthLoss));
            userStatsRepository.save(stats);
        }
    }

    public boolean isInRescueMode(User user) {
        UserStats stats = userStatsRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Stats not found"));
        return stats.getRescueModeSince() != null;
    }

    private short calculatedLevel(int xp) {
        if (xp < 100) return 1;
        if (xp < 300) return 2;
        if (xp < 600) return 3;
        if (xp < 1000) return 4;
        return (short) (5 + (xp - 1000) / 500);
    }
}
