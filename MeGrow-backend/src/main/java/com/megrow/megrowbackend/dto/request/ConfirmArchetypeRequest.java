package com.megrow.megrowbackend.dto.request;

import com.megrow.megrowbackend.enums.Archetype;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ConfirmArchetypeRequest {

    @NotNull(message = "Archetype is required")
    private Archetype archetype;

    @NotNull(message = "Confirmed field is required")
    private Boolean confirmed;
}
