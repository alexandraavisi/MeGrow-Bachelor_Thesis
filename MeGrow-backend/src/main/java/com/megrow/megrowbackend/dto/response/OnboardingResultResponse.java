package com.megrow.megrowbackend.dto.response;

import com.megrow.megrowbackend.enums.Archetype;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class OnboardingResultResponse {
    private Short scoreO;
    private Short scoreV;
    private Short scoreM;
    private Short scoreS;
    private Archetype calculatedArchetype;
    private boolean gentleMode;
}
