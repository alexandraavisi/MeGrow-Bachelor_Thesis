package com.megrow.megrowbackend.service;

import com.megrow.megrowbackend.dto.request.ConfirmArchetypeRequest;
import com.megrow.megrowbackend.dto.request.OnboardingSubmitRequest;
import com.megrow.megrowbackend.dto.response.OnboardingQuestionsResponse;
import com.megrow.megrowbackend.dto.response.OnboardingResultResponse;
import com.megrow.megrowbackend.entities.OnboardingAnswer;
import com.megrow.megrowbackend.entities.OnboardingQuestion;
import com.megrow.megrowbackend.entities.User;
import com.megrow.megrowbackend.entities.UserProfile;
import com.megrow.megrowbackend.enums.Archetype;
import com.megrow.megrowbackend.repository.OnboardingAnswerRepository;
import com.megrow.megrowbackend.repository.OnboardingQuestionRepository;
import com.megrow.megrowbackend.repository.UserProfileRepository;
import com.megrow.megrowbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OnboardingService {
    private final OnboardingQuestionRepository questionRepository;
    private final OnboardingAnswerRepository answerRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    public List<OnboardingQuestionsResponse> getQuestions() {
        List<OnboardingQuestion> questions = questionRepository.findAll();
        Collections.shuffle(questions);
        return questions.stream()
                .map(q -> new OnboardingQuestionsResponse(
                        q.getQuestionIndex(),
                        q.getText(),
                        q.isReverse()))
                .collect(Collectors.toList());
    }

    @Transactional
    public OnboardingResultResponse submitAnswers(OnboardingSubmitRequest request) {
        User user = getCurrentUser();

        if(user.isOnboardingCompleted()) {
            throw new RuntimeException("Onboarding is already completed");
        }

        Map<Short, OnboardingQuestion > questionMap = questionRepository.findAll()
                .stream()
                .collect(Collectors.toMap(OnboardingQuestion::getQuestionIndex, q -> q));

        short scoreO = 0, scoreV = 0, scoreM = 0, scoreS = 0;

        for (OnboardingSubmitRequest.AnswerRequest answer : request.getAnswers()) {
            OnboardingQuestion question = questionMap.get(answer.getQuestionIndex());
            if (question == null) {
                throw new RuntimeException("Invalid question index: " + answer.getQuestionIndex());
            }

            short value = answer.getAnswerValue();
            if (value < 1 || value > 5) {
                throw new RuntimeException("Answer value must be between 1 and 5");
            }

            short score = question.isReverse() ? (short) (6 - value) : value;

            OnboardingAnswer onboardingAnswer = OnboardingAnswer.builder()
                    .user(user)
                    .question(question)
                    .answerValue(value)
                    .build();
            answerRepository.save(onboardingAnswer);

            switch (question.getDimension()) {
                case "O" -> scoreO += score;
                case "V" -> scoreV += score;
                case "M" -> scoreM += score;
                case "S" -> scoreS += score;
            }
        }

        Archetype archetype = calculateArchetype(scoreO, scoreV, scoreM);
        boolean gentleMode  = scoreS >= 20;

        UserProfile profile = userProfileRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        profile.setScoreO(scoreO);
        profile.setScoreV(scoreV);
        profile.setScoreM(scoreM);
        profile.setScoreS(scoreS);
        profile.setCalculatedArchetype(archetype);
        profile.setFinalArchetype(archetype);
        profile.setGentleMode(gentleMode);
        userProfileRepository.save(profile);

        return new OnboardingResultResponse(scoreO, scoreV, scoreM, scoreS, archetype, gentleMode);
    }

    @Transactional
    public void confirmArchetype(ConfirmArchetypeRequest request) {
        User user = getCurrentUser();

        UserProfile profile = userProfileRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        profile.setFinalArchetype(request.getArchetype());
        profile.setArchetypeConfirmed(true);
        userProfileRepository.save(profile);

        user.setOnboardingCompleted(true);
        userRepository.save(user);
    }

    private Archetype calculateArchetype(short scoreO, short scoreV, short scoreM) {
        if (scoreM >= scoreO && scoreM >= scoreV)
            return Archetype.ACHIEVER;

        if (scoreO >= scoreV)
            return Archetype.PLANNER;

        return Archetype.EXPLORER;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
