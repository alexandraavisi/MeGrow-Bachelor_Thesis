package com.megrow.megrowbackend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
public class UserStatsResponse {
    private int xpTotal;
    private short level;
    private short treeHealth;
    private short streakDays;
    private LocalDate lastActivityDate;
    private boolean rescueMode;
}
