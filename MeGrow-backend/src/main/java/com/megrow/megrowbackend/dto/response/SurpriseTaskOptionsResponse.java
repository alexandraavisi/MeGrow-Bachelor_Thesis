package com.megrow.megrowbackend.dto.response;

import com.megrow.megrowbackend.enums.ItemType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
public class SurpriseTaskOptionsResponse {
    private UUID option1Id;
    private String option1Title;
    private ItemType option1Type;
    private int option1EstimatedMinutes;

    private UUID option2Id;
    private String option2Title;
    private ItemType option2Type;
    private int option2EstimatedMinutes;
}
