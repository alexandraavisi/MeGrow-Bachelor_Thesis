package com.megrow.megrowbackend.controller;

import com.megrow.megrowbackend.dto.request.CreateCustomHabitRequest;
import com.megrow.megrowbackend.dto.request.StepsRequest;
import com.megrow.megrowbackend.dto.response.HabitResponse;
import com.megrow.megrowbackend.service.HabitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/habits")
@RequiredArgsConstructor
public class HabitController {
    private final HabitService habitService;

    @GetMapping
    public ResponseEntity<List<HabitResponse>> getHabits() {
        return ResponseEntity.ok(habitService.getHabits());
    }

    @PostMapping("/{id}/log")
    public ResponseEntity<HabitResponse> logHabit(@PathVariable UUID id) {
        return ResponseEntity.ok(habitService.logHabit(id));
    }

    @PostMapping("/custom")
    public ResponseEntity<HabitResponse> createCustomHabit(
            @Valid @RequestBody CreateCustomHabitRequest request) {
        return ResponseEntity.ok(habitService.createCustomHabit(request));
    }

    @PostMapping("/steps")
    public ResponseEntity<HabitResponse> logSteps(
            @Valid @RequestBody StepsRequest request) {
        return ResponseEntity.ok(habitService.logSteps(request));
    }

}
