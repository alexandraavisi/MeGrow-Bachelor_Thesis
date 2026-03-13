package com.megrow.megrowbackend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(
        name = "onboarding_answers",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "question_index"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id",  nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_index",  nullable = false)
    private OnboardingQuestion question;

    @Column(name = "answer_value",  nullable = false)
    private short answerValue;
}
