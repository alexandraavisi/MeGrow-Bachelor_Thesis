package com.megrow.megrowbackend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
public class GoalProgressResponse {
    private UUID goalId;
    private String title;
    private String category;
    private int totalItems;
    private int completedItems;
    private double progressPercentage;
}
