package com.megrow.megrowbackend.dto.request;

import com.megrow.megrowbackend.enums.Difficulty;
import com.megrow.megrowbackend.enums.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
public class CreateTaskRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Difficulty is required")
    private Difficulty difficulty;

    private Priority priority;

    private Short estimatedMinutes;

    @NotNull(message = "Scheduled date is required")
    private LocalDate scheduledDate;

    private OffsetDateTime deadlineAt;

    private UUID parentTaskId;
}
