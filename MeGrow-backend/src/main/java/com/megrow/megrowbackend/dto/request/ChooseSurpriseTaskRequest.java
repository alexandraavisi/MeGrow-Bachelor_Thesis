package com.megrow.megrowbackend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ChooseSurpriseTaskRequest {

    @NotNull(message = "Backlog item is required")
    private UUID backlogItemId;
}
