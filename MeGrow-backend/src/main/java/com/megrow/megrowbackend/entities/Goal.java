package com.megrow.megrowbackend.entities;

import com.megrow.megrowbackend.enums.GoalCategory;
import com.megrow.megrowbackend.enums.GoalLevel;
import com.megrow.megrowbackend.enums.GoalStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "goals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Goal {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GoalCategory category;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String motivation;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private GoalLevel level;

    @Column(name = "duration_weeks", nullable = false)
    private short durationWeeks;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GoalStatus  status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "goal",  cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<GoalBacklogItem> backlogItems;

    @PrePersist
    void prePersist() {
        this.createdAt = OffsetDateTime.now();
        if (this.status == null)
            this.status = GoalStatus.ACTIVE;
    }
}
