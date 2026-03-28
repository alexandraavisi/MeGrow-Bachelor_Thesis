package com.megrow.megrowbackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateCustomHabitRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;
}
