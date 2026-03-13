package com.megrow.megrowbackend.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "onboarding_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingQuestion {
    @Id
    @Column(name = "question_index",  nullable = false)
    private short questionIndex;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(nullable = false, length = 1)
    private String dimension;

    @Column(name = "is_reverse", nullable = false)
    private boolean isReverse;
}
