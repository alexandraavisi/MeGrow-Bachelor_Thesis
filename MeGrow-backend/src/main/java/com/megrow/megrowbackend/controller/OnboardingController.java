package com.megrow.megrowbackend.controller;

import com.megrow.megrowbackend.dto.request.ConfirmArchetypeRequest;
import com.megrow.megrowbackend.dto.request.OnboardingSubmitRequest;
import com.megrow.megrowbackend.dto.response.OnboardingQuestionsResponse;
import com.megrow.megrowbackend.dto.response.OnboardingResultResponse;
import com.megrow.megrowbackend.service.OnboardingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final OnboardingService onboardingService;

   @GetMapping("/questions")
    public ResponseEntity <List<OnboardingQuestionsResponse>> getQuestions() {
       return ResponseEntity.ok(onboardingService.getQuestions());
   }

   @PostMapping("/submit")
    public ResponseEntity<OnboardingResultResponse> submitAnswers(
           @Valid @RequestBody OnboardingSubmitRequest request) {
       return ResponseEntity.ok(onboardingService.submitAnswers(request));
   }

   @PostMapping("/confirm")
    public ResponseEntity<Void> confirmArchetype(
            @Valid @RequestBody ConfirmArchetypeRequest request) {
       onboardingService.confirmArchetype(request);
       return ResponseEntity.ok().build();
   }
}
