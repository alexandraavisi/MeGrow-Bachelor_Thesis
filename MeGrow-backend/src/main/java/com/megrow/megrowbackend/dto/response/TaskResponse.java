package com.megrow.megrowbackend.dto.response;

import com.megrow.megrowbackend.enums.Difficulty;
import com.megrow.megrowbackend.enums.Priority;
import com.megrow.megrowbackend.enums.TaskSource;
import com.megrow.megrowbackend.enums.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
public class TaskResponse {
    private UUID id;
    private String title;
    private String description;
    private TaskSource source;
    private TaskStatus status;
    private Priority priority;
    private Difficulty difficulty;
    private Short estimatedMinutes;
    private LocalDate scheduledDate;
    private OffsetDateTime deadlineAt;
    private OffsetDateTime startedAt;
    private OffsetDateTime completedAt;
    private OffsetDateTime createdAt;
    private UUID parentTaskId;
    private UUID goalId;
}
