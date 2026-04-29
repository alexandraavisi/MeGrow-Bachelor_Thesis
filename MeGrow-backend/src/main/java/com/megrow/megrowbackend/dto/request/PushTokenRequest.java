package com.megrow.megrowbackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PushTokenRequest {

    @NotBlank(message = "Push token is required")
    private String pushToken;
}
