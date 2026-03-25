package com.megrow.megrowbackend.controller;

import com.megrow.megrowbackend.dto.request.CreateGoalRequest;
import com.megrow.megrowbackend.dto.response.GoalResponse;
import com.megrow.megrowbackend.enums.GoalStatus;
import com.megrow.megrowbackend.service.GoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor()
public class GoalController {

    private final GoalService goalService;

    @PostMapping
    public ResponseEntity<GoalResponse> createGoal(
            @Valid @RequestBody CreateGoalRequest request) {
        return ResponseEntity.ok(goalService.createGoal(request));
    }

    @GetMapping
    public ResponseEntity<List<GoalResponse>> getGoals() {
        return ResponseEntity.ok(goalService.getGoals());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GoalResponse> getGoalById(@PathVariable UUID id) {
        return ResponseEntity.ok(goalService.getGoalById(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<GoalResponse> updateGoalStatus(
            @PathVariable UUID id,
            @RequestParam GoalStatus status) {
        return ResponseEntity.ok(goalService.updateGoalStatus(id, status));
    }
}
