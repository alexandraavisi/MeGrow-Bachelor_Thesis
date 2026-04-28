package com.megrow.megrowbackend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class StepsRequest {

    @NotNull(message = "Steps count is required")
    @Min(value = 0, message = "Steps cannot be negative")
    private Integer steps;
}
