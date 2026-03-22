package com.megrow.megrowbackend.service;

import com.megrow.megrowbackend.dto.request.LoginRequest;
import com.megrow.megrowbackend.dto.request.RegisterRequest;
import com.megrow.megrowbackend.dto.response.AuthResponse;
import com.megrow.megrowbackend.entities.User;
import com.megrow.megrowbackend.entities.UserProfile;
import com.megrow.megrowbackend.entities.UserStats;
import com.megrow.megrowbackend.repository.UserProfileRepository;
import com.megrow.megrowbackend.repository.UserRepository;
import com.megrow.megrowbackend.repository.UserStatsRepository;
import com.megrow.megrowbackend.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    private final UserProfileRepository userProfileRepository;

    private final UserStatsRepository userStatsRepository;

    private final PasswordEncoder passwordEncoder;

    private final JwtUtils jwtUtils;

    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .isOnboardingCompleted(false)
                .isActive(true)
                .build();
        userRepository.save(user);

        UserProfile profile = UserProfile.builder()
                .user(user)
                .build();
        userProfileRepository.save(profile);

        UserStats stats = UserStats.builder()
                .user(user)
                .xpTotal(0)
                .level((short) 1)
                .treeHealth((short) 100)
                .streakDays((short) 0)
                .build();
        userStatsRepository.save(stats);

        String token = jwtUtils.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getName());
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setLastLoginAt(OffsetDateTime.now());
        userRepository.save(user);

        String token = jwtUtils.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getName());
    }

}
