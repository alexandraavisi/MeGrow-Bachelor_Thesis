package com.megrow.megrowbackend.service;

import com.megrow.megrowbackend.entities.UserProfile;
import com.megrow.megrowbackend.enums.Archetype;
import tools.jackson.databind.ObjectMapper;
import com.megrow.megrowbackend.entities.Goal;
import com.megrow.megrowbackend.entities.GoalBacklogItem;
import com.megrow.megrowbackend.enums.ItemType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class AiBacklogService {

    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.model}")
    private String model;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient = RestClient.create();

    public List<GoalBacklogItem> generateBacklog(Goal goal, UserProfile profile) {
        String prompt = buildPrompt(goal, profile);

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", "You are a personal development assistant. Always respond with a valid JSON, no markdown, no explanation."),
                        Map.of("role", "user", "content", prompt)
                ),
                "temperature", 0.7,
                "max_tokens", 4000
        );

        Map response = restClient.post()
                .uri("https://api.openai.com/v1/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        List<Map> choices = (List<Map>) response.get("choices");
        Map message = (Map) choices.get(0).get("message");
        String content = (String) message.get("content");

        return parseBacklog(content, goal);
    }

    private String buildPrompt(Goal goal, UserProfile profile) {
        String archetypeDescription = getArchetypeDescription(profile.getFinalArchetype());
        String gentleDescriprion = profile.isGentleMode()
                ? "GENTLE MODE ON: User is prone to procrastination and abandonment. Keep tasks short (max 15 min), simple and achievable. Avoid overwhelming tasks."
                : "GENTLE MODE OFF: User is resilient and motivated. Can handle longer and more complex tasks.";

        return String.format("""
                You are a personal development coach creating a personalized learning plan.
                
                USER PROFILE:
                - Archetype: %s - %s
                - %s
                
                GOAL:
                - Category: %s
                - Title: %s
                - Level: %s
                - Duration: %d weeks
                - Motivation: %s
                
                Generate a structured backlog of 20-30 items divided into 3 phases.
                
                Return a JSON array with this exact structure:
                [
                    {
                        "phase": 1,
                        "orderIndex": 1,
                        "itemType": "VOCAB",
                        "title": "Item title",
                        "details": {
                            ...specific fields based on itemType...
                        },
                        "estimatedMinutes": 20
                    }
                ]
                
                RULES FOR DETAILS FIELD:
                        - VOCAB: {"words": ["word1", "word2"], "translations": ["trans1", "trans2"], "example_sentences": ["sentence1"]}
                        - LEARN: {"topics": ["topic1"], "resources": ["resource1"], "key_concepts": ["concept1"]}
                        - LISTEN: {"description": "what to listen to", "source": "podcast/video/song", "focus": "what to pay attention to"}
                        - SPEAK: {"instructions": "what to practice", "example": "example phrase", "challenge": "extra challenge for achievers"}
                        - PRACTICE: {"exercises": ["exercise1", "exercise2"], "goal": "what to achieve"}
                        - REVIEW: {"topics": ["topic to review"], "method": "how to review"}
                        - BUILD: {"project": "project description", "instructions": "step by step", "deliverable": "what to produce"}
                        - WORKOUT: {"exercises": [{"name": "exercise name", "sets": 3, "reps": 20, "rest_seconds": 30}], "instructions": "general instructions", "estimated_calories": 50}
                        - RECOVERY: {"activity": "light activity", "focus": "what to consolidate"}
                        
                
                IMPORTANT RULES:
                - For WORKOUT tasks: use sets and reps, NOT duration per exercise
                - estimatedMinutes should reflect realistic total workout time including rest
                - A typical 3 sets x 20 reps circuit = 15-20 minutes total
                - Always ensure estimatedMinutes is realistic and consistent with the workout volume
                
                                
                ARCHETYPE RULES:
                %s
                
                Return ONLY the JSON array, no other text.
                """,
                profile.getFinalArchetype(),
                archetypeDescription,
                gentleDescriprion,
                goal.getCategory(),
                goal.getTitle(),
                goal.getLevel() != null ? goal.getLevel() : "BEGINNER",
                goal.getDurationWeeks(),
                goal.getMotivation() != null ? goal.getMotivation() : "General improvement",
                getArchetypeRules(profile.getFinalArchetype(), profile.isGentleMode())
                );
    }

    private String getArchetypeDescription(Archetype archetype) {
        return switch(archetype) {
            case ACHIEVER -> "Motivated by progress and results. Prefers challenging tasks and wants to see rapid improvement.";
            case PLANNER -> "Prefers structure and organization. Likes clear steps and consistent progress.";
            case EXPLORER -> "Prefers variety and flexibility. Gets bored with repetition, loves discovering new things.";
        };
    }

    private String getArchetypeRules(Archetype archetype, boolean gentleMode) {
        String base = switch (archetype) {
            case ACHIEVER -> """
                    - Include more PRACTICE and BUILD tasks (at least 40%% of total)
                    - Make tasks progressively harder within each phase
                    - Add 'challenge' field in SPEAK and BUILD details with extra difficult exercises
                    - Fewer REVIEW tasks (max 2 per phase)
                    - estimatedMinutes should be between 20-30 minutes per task 
                    """;
            case PLANNER -> """
                    - Include more LEARN and REVIEW tasks for solid foundation
                    - Keep consistent difficulty progression
                    - Add 'key_concepts' in LEARN details
                    - Balance all item types evenly
                    - estimatedMinutes should be between 15-25 minutes per task
                    """;
            case EXPLORER -> """
                    - Alternate item types frequently, never repeat same type consecutively
                    - Include diverse and interesting topics
                    - Add fun facts or cultural notes in details where relevant 
                    - Include LISTEN tasks with varied sources (songs, podcasts, movies)
                    - estimatedMinutes should be between 15-20 minutes per task 
                    """;
        };

        if (gentleMode) {
            base += """
                    - GENTLE MODE: Reduce estimatedMinutes to maximum 15 minutes per task
                    - Keep instructions simple and encouraging
                    - Add 'encouraging' field in details with motivational message
                    """;
        }

        return base;
    }

    private List<GoalBacklogItem> parseBacklog(String response, Goal goal) {
        try {
            List<Map<String, Object>> items = objectMapper.readValue(
                    response, objectMapper.getTypeFactory()
                            .constructCollectionType(List.class, Map.class));

            return  items.stream().map(item -> {
                short phase = ((Number) item.get("phase")).shortValue();
                short orderIndex = ((Number) item.get("orderIndex")).shortValue();
                String itemTypeStr = ((String) item.get("itemType"));
                String title =  ((String) item.get("title"));
                short estimatedMinutes = ((Number) item.get("estimatedMinutes")).shortValue();
                Object details = item.get("details");

                ItemType itemType;
                try {
                    itemType = ItemType.valueOf(itemTypeStr);
                } catch (Exception e) {
                    itemType = ItemType.LEARN;
                }

                Map<String, Object> detailsMap = null;
                if (details instanceof Map) {
                    detailsMap = (Map<String, Object>) details;
                }

                return GoalBacklogItem.builder()
                        .goal(goal)
                        .phase(phase)
                        .orderIndex(orderIndex)
                        .itemType(itemType)
                        .title(title)
                        .details(detailsMap)
                        .estimatedMinutes(estimatedMinutes)
                        .isCompleted(false)
                        .build();
            }).collect(java.util.stream.Collectors.toList());
        }  catch (Exception e) {
            throw new RuntimeException("Failed to parse AI response: " + e.getMessage());
        }
    }

}