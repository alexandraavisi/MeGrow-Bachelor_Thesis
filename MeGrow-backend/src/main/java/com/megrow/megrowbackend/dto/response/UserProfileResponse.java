package com.megrow.megrowbackend.dto.response;

import com.megrow.megrowbackend.enums.Archetype;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class UserProfileResponse {
    private String name;
    private String email;
    private Archetype calculatedArchetype;
    private Archetype finalArchetype;
    private boolean archetypeConfirmed;
    private boolean gentleMode;
    private short scoreO;
    private short scoreV;
    private short scoreM;
    private short scoreS;
}
