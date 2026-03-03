package com.megrow.megrowbackend.entity;

import com.megrow.megrowbackend.enums.ItemType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(
        name = "goal_backlog_items",
        uniqueConstraints = @UniqueConstraint(columnNames = {"goal_id", "order_index"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoalBacklogItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    private Goal goal;

    @Column(nullable = false)
    private short phase;

    @Column(name = "order_index", nullable = false)
    private short orderIndex;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type",  nullable = false,  length = 20)
    private ItemType itemType;

    @Column(nullable = false, length = 300)
    private String title;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> details;

    @Column(name = "estimated_minutes", nullable = false)
    private short estimatedMinutes;

    @Column(name = "is_completed",  nullable = false)
    private boolean isCompleted;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;
}
