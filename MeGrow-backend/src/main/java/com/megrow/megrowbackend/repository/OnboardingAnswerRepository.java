package com.megrow.megrowbackend.repository;

import com.megrow.megrowbackend.entities.OnboardingAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OnboardingAnswerRepository extends JpaRepository<OnboardingAnswer, UUID> {
    List<OnboardingAnswer> findByUserId(UUID userId);
    boolean existsByUserId(UUID userId);
}
