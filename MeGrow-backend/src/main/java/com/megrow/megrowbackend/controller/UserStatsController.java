package com.megrow.megrowbackend.controller;

import com.megrow.megrowbackend.dto.response.UserStatsResponse;
import com.megrow.megrowbackend.entities.User;
import com.megrow.megrowbackend.entities.UserStats;
import com.megrow.megrowbackend.repository.UserRepository;
import com.megrow.megrowbackend.repository.UserStatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserStatsController {

    private final UserStatsRepository  userStatsRepository;
    private final UserRepository userRepository;

    @GetMapping("/stats")
    public ResponseEntity<UserStatsResponse> getStats() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserStats stats = userStatsRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Stats not found"));

        return ResponseEntity.ok(new UserStatsResponse(
                stats.getXpTotal(),
                stats.getLevel(),
                stats.getTreeHealth(),
                stats.getStreakDays(),
                stats.getLastActivityDate(),
                stats.getRescueModeSince() != null
        ));
    }
}
