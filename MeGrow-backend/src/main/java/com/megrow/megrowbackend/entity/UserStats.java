package com.megrow.megrowbackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "user_stats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStats {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "xp_total", nullable = false)
    private int xpTotal;

    @Column(nullable = false)
    private short level;

    @Column(name = "tree_health", nullable = false)
    private short treeHealth;

    @Column(name = "streak_days",  nullable = false)
    private short streakDays;

    @Column(name = "last_activity_date")
    private LocalDate lastActivityDate;

    @Column(name = "rescue_mode_since")
    private LocalDate rescueModeSince;
}
