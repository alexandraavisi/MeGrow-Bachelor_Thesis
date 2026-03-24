package com.megrow.megrowbackend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class OnboardingQuestionsResponse {

    private Short questionIndex;

    private String text;

    private boolean isReverse;
}
