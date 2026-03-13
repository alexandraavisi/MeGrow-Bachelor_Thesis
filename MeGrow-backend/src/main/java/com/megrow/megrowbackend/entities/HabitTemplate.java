package com.megrow.megrowbackend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "habit_templates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HabitTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_custom", nullable = false)
    private boolean isCustom;

    @Column(name = "is_active",  nullable = false)
    private boolean isActive;

    @PrePersist
    void prePersist() {
        this.isActive = true;
    }
}
