package com.megrow.megrowbackend.entities;

import com.megrow.megrowbackend.enums.Difficulty;
import com.megrow.megrowbackend.enums.Priority;
import com.megrow.megrowbackend.enums.TaskSource;
import com.megrow.megrowbackend.enums.TaskStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id")
    private Goal goal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_task_id")
    private Task parentTask;

    @OneToMany(mappedBy = "parentTask", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Task> subtasks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "backlog_item_id")
    private GoalBacklogItem backlogItem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskSource source;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskStatus status;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Difficulty difficulty;

    @Column(name = "estimated_minutes")
    private Short estimatedMinutes;

    @Column(name = "scheduled_date")
    private LocalDate scheduledDate;

    @Column(name = "deadline_at")
    private OffsetDateTime deadlineAt;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = OffsetDateTime.now();
        if (this.status == null)
            this.status = TaskStatus.TODO;
    }

    @OneToMany(mappedBy = "task",  cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TaskTimeSession>  timeSessions;
}
