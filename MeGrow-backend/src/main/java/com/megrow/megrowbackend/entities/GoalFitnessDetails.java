package com.megrow.megrowbackend.entities;

import com.megrow.megrowbackend.enums.FitnessType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "goal_fitness_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoalFitnessDetails {
    @Id
    @Column(name = "goal_id")
    private UUID goalId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "goal_id")
    private Goal goal;

    @Column(name = "is_physically_active", nullable = false)
    private boolean isPhysicallyActive;

    @Enumerated(EnumType.STRING)
    @Column(name = "fitness_type", nullable = false, length = 20)
    private FitnessType fitnessType;
}
