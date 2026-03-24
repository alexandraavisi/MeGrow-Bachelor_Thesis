package com.megrow.megrowbackend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class OnboardingSubmitRequest {

    @NotNull
    @Size(min = 20, max = 20, message = "All 20 questions must be answered")
    private List<AnswerRequest> answers;

    @Getter
    @Setter
    public static class AnswerRequest {
        @NotNull
        private short questionIndex;

        @NotNull
        private short answerValue;
    }
}
