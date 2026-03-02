package com.megrow.megrowbackend.entity;

import com.megrow.megrowbackend.enums.Archetype;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_profile")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {
    @Id
    @Column(name = "user_id")
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "score_o", nullable = false)
    private short scoreO;

    @Column(name = "score_v", nullable = false)
    private short scoreV;

    @Column(name = "score_m", nullable = false)
    private short scoreM;

    @Column(name = "score_s", nullable = false)
    private short scoreS;

    @Enumerated(EnumType.STRING)
    @Column(name = "calculated_archetype")
    private Archetype calculatedArchetype;

    @Enumerated(EnumType.STRING)
    @Column(name = "final_archetype")
    private Archetype finalArchetype;

    @Column(name = "archetype_confirmed", nullable = false)
    private boolean isArchetypeConfirmed;

    @Column(name = "gentle_mode",  nullable = false)
    private boolean isGentleMode;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        this.updatedAt = OffsetDateTime.now();
    }
}
