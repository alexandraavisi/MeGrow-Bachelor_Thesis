package com.megrow.megrowbackend.dto.response;

import com.megrow.megrowbackend.enums.FitnessType;
import com.megrow.megrowbackend.enums.GoalCategory;
import com.megrow.megrowbackend.enums.GoalLevel;
import com.megrow.megrowbackend.enums.GoalStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
public class GoalResponse {
    private UUID id;
    private GoalCategory category;
    private String title;
    private String description;
    private String motivation;
    private GoalLevel level;
    private Short durationWeeks;
    private GoalStatus status;
    private OffsetDateTime createdAt;

    private FitnessType fitnessType;
    private Boolean isPhysicallyActive;
}
