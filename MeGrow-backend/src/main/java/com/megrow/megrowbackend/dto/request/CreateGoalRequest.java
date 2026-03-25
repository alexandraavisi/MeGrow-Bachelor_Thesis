package com.megrow.megrowbackend.dto.request;

import com.megrow.megrowbackend.enums.FitnessType;
import com.megrow.megrowbackend.enums.GoalCategory;
import com.megrow.megrowbackend.enums.GoalLevel;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateGoalRequest {

    @NotNull(message = "Category is required")
    private GoalCategory category;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private String motivation;

    private GoalLevel level;

    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1 week")
    @Max(value = 52, message = "duration must be at most 52 weeks")
    private Short durationWeeks;

    private FitnessType  fitnessType;
    private Boolean isPhysicallyActive;
}
