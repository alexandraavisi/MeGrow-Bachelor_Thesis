package com.megrow.megrowbackend.entities;

import com.megrow.megrowbackend.enums.HabitSource;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
        name = "habit_logs",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "habit_template_id", "log_date"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HabitLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habit_template_id", nullable = false)
    private HabitTemplate habitTemplate;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(name = "completed")
    private boolean isCompleted;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private HabitSource source;

    @PrePersist
    void prePersist() {
        if(this.source==null){
            this.source = HabitSource.MANUAL;
        }
    }
}
