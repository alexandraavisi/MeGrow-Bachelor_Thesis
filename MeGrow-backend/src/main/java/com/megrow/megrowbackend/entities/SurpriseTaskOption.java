package com.megrow.megrowbackend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "surprise_task_options")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurpriseTaskOption {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "backlog_item_id", nullable = false)
    private GoalBacklogItem backlogItem;
}
