package com.megrow.megrowbackend.repository;

import com.megrow.megrowbackend.entities.OnboardingQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OnboardingQuestionRepository extends JpaRepository<OnboardingQuestion, Short> {
}
