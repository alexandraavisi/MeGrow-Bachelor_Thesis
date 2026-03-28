package com.megrow.megrowbackend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
public class HabitResponse {
    private UUID id;
    private String code;
    private String title;
    private String description;
    private boolean isCustom;
    private boolean isActive;
    private boolean completedToday;
}
