package com.megrow.megrowbackend.controller;

import com.megrow.megrowbackend.dto.request.CreateTaskRequest;
import com.megrow.megrowbackend.dto.request.UpdateTaskStatusRequest;
import com.megrow.megrowbackend.dto.response.TaskResponse;
import com.megrow.megrowbackend.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(
            @Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.ok(taskService.createTask(request));
    }

    @GetMapping("/today")
    public ResponseEntity<List<TaskResponse>> getTodayTasks() {
        return ResponseEntity.ok(taskService.getTodayTasks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTaskById(@PathVariable UUID id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    @GetMapping("/{id}/subtasks")
    public ResponseEntity<List<TaskResponse>> getSubtasks(@PathVariable UUID id) {
        return ResponseEntity.ok(taskService.getSubtasks(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> updateTaskStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTaskStatusRequest request) {
        return ResponseEntity.ok(taskService.updateTaskStatus(id, request));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<TaskResponse> startTask(@PathVariable UUID id) {
        return ResponseEntity.ok(taskService.startTask(id));
    }

    @PostMapping("/{id}/pause")
    public ResponseEntity<TaskResponse> pauseTask(@PathVariable UUID id) {
        return ResponseEntity.ok(taskService.pauseTask(id));
    }
}
