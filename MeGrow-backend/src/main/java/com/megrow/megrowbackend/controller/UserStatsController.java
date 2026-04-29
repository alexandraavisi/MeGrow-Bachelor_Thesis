package com.megrow.megrowbackend.controller;

import com.megrow.megrowbackend.dto.request.ChangePasswordRequest;
import com.megrow.megrowbackend.dto.request.PushTokenRequest;
import com.megrow.megrowbackend.dto.response.UserProfileResponse;
import com.megrow.megrowbackend.dto.response.UserStatsResponse;
import com.megrow.megrowbackend.entities.User;
import com.megrow.megrowbackend.entities.UserProfile;
import com.megrow.megrowbackend.entities.UserStats;
import com.megrow.megrowbackend.repository.UserProfileRepository;
import com.megrow.megrowbackend.repository.UserRepository;
import com.megrow.megrowbackend.repository.UserStatsRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserStatsController {

    private final UserStatsRepository  userStatsRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;

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

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfile profile = userProfileRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        return ResponseEntity.ok(new UserProfileResponse(
                user.getName(),
                user.getEmail(),
                profile.getCalculatedArchetype(),
                profile.getFinalArchetype(),
                profile.isArchetypeConfirmed(),
                profile.isGentleMode(),
                profile.getScoreO(),
                profile.getScoreV(),
                profile.getScoreM(),
                profile.getScoreS()
        ));
    }

    @PatchMapping("/password")
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {

        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Current password is incorrect");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/account")
    public ResponseEntity<Void> deleteAccount() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setActive(false);
        userRepository.save(user);

        return ResponseEntity.ok().build();
    }

    @PatchMapping("/push-token")
    public ResponseEntity<Void> updatePushToken(
            @Valid @RequestBody PushTokenRequest request) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPushToken(request.getPushToken());
        userRepository.save(user);

        return ResponseEntity.ok().build();
    }
}
