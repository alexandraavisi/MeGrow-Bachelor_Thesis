package com.megrow.megrowbackend.entities;

import com.megrow.megrowbackend.enums.OverloadLevel;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
        name = "daily_plans",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "plan_date"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class DailyPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "plan_date", nullable = false)
    private LocalDate planDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "overload_level",  nullable = false, length = 20)
    private OverloadLevel overloadLevel;

    @Column(name = "total_estimated_minutes", nullable = false)
    private short totalEstimatedMinutes;

    @PrePersist
    void prePersist() {
        if (this.overloadLevel == null)
            this.overloadLevel = OverloadLevel.NONE;
        if (this.totalEstimatedMinutes == 0)
            this.totalEstimatedMinutes = 0;
    }
}
