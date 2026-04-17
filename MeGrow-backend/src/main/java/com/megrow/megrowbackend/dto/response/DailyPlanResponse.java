package com.megrow.megrowbackend.dto.response;

import com.megrow.megrowbackend.enums.OverloadLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
public class DailyPlanResponse {
    private UUID id;
    private LocalDate planDate;
    private OverloadLevel overloadLevel;
    private short totalEstimatedMinutes;
    private List<TaskResponse> tasks;
}
