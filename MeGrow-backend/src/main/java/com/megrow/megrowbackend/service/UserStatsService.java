package com.megrow.megrowbackend.service;

import com.megrow.megrowbackend.entities.User;
import com.megrow.megrowbackend.entities.UserStats;
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
    public void checkAndActivateRescueMode(User user) {
        UserStats stats = userStatsRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Stats not found"));

        if (stats.getLastActivityDate() == null) return;

        long daysSinceActivity = java.time.temporal.ChronoUnit.DAYS.between(stats.getLastActivityDate(), LocalDate.now());

        if (daysSinceActivity >= 3 && stats.getRescueModeSince() == null) {
            stats.setRescueModeSince(LocalDate.now());
            userStatsRepository.save(stats);
        }
    }

    public boolean isInRescueMode(User user) {
        UserStats stats = userStatsRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Stats not found"));
        return stats.getRescueModeSince() != null;
    }
}
