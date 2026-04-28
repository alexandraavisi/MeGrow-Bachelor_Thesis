package com.megrow.megrowbackend.service;

import com.megrow.megrowbackend.dto.request.CreateCustomHabitRequest;
import com.megrow.megrowbackend.dto.request.StepsRequest;
import com.megrow.megrowbackend.dto.response.HabitResponse;
import com.megrow.megrowbackend.entities.HabitLog;
import com.megrow.megrowbackend.entities.HabitTemplate;
import com.megrow.megrowbackend.entities.User;
import com.megrow.megrowbackend.enums.HabitSource;
import com.megrow.megrowbackend.repository.HabitLogRepository;
import com.megrow.megrowbackend.repository.HabitTemplateRepository;
import com.megrow.megrowbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HabitService {

    private final HabitTemplateRepository  habitTemplateRepository;
    private final HabitLogRepository habitLogRepository;
    private final UserRepository userRepository;
    private final UserStatsService userStatsService;

    public List<HabitResponse> getHabits() {
        User user = getCurrentUser();
        LocalDate today = LocalDate.now();

        List<HabitTemplate> predefined = habitTemplateRepository.findByUserIdIsNull();
        List<HabitTemplate> custom = habitTemplateRepository.findByUserId(user.getId());

        predefined.addAll(custom);

        return predefined.stream()
                .filter(HabitTemplate::isActive)
                .map(habit -> {
                    boolean completedToday = habitLogRepository
                            .existsByUserIdAndHabitTemplateIdAndLogDate(
                                    user.getId(), habit.getId(), today);
                    return mapToResponse(habit, completedToday);
                }).collect(Collectors.toList());
    }

    @Transactional
    public HabitResponse logHabit(UUID habitTemplateId) {
        User user = getCurrentUser();
        LocalDate today = LocalDate.now();

        HabitTemplate habit = habitTemplateRepository.findById(habitTemplateId)
                .orElseThrow(() -> new RuntimeException("Habit not found"));

        if (habitLogRepository.existsByUserIdAndHabitTemplateIdAndLogDate(
                user.getId(), habitTemplateId, today)) {
            throw new RuntimeException("Habit already completed today");
        }

        HabitLog log = HabitLog.builder()
                .user(user)
                .habitTemplate(habit)
                .logDate(today)
                .isCompleted(true)
                .source(HabitSource.MANUAL)
                .build();
        habitLogRepository.save(log);

        userStatsService.awardHealthForHabit(user);

        return mapToResponse(habit, true);
    }

    @Transactional
    public HabitResponse createCustomHabit(CreateCustomHabitRequest request) {
        User user = getCurrentUser();

        HabitTemplate habit = HabitTemplate.builder()
                .user(user)
                .title(request.getTitle())
                .description(request.getDescription())
                .isCustom(true)
                .isActive(true)
                .build();
        habitTemplateRepository.save(habit);

        return mapToResponse(habit, false);
    }

    @Transactional
    public HabitResponse logSteps(StepsRequest request) {
        User user = getCurrentUser();
        LocalDate today = LocalDate.now();

        HabitTemplate walkHabit = habitTemplateRepository.findByCode("WALK_STEPS")
                .orElseThrow(() -> new RuntimeException("Walk habit not found"));

        int targetSteps = 6000;

        if (request.getSteps() < targetSteps) {
            return mapToResponse(walkHabit, false);
        }

        if (habitLogRepository.existsByUserIdAndHabitTemplateIdAndLogDate(
                user.getId(), walkHabit.getId(), today)) {
            return mapToResponse(walkHabit, true);
        }

        HabitLog log = HabitLog.builder()
                .user(user)
                .habitTemplate(walkHabit)
                .logDate(today)
                .isCompleted(true)
                .source(HabitSource.AUTO_STEPS)
                .build();
        habitLogRepository.save(log);

        userStatsService.awardHealthForHabit(user);

        return mapToResponse(walkHabit, true);
    }

    private HabitResponse mapToResponse(HabitTemplate habit, boolean completedToday) {
        return new HabitResponse(
                habit.getId(),
                habit.getCode(),
                habit.getTitle(),
                habit.getDescription(),
                habit.isCustom(),
                habit.isActive(),
                completedToday
        );
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
