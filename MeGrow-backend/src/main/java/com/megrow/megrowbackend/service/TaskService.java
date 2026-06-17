package com.megrow.megrowbackend.service;

import com.megrow.megrowbackend.dto.request.ChooseSurpriseTaskRequest;
import com.megrow.megrowbackend.dto.request.CreateTaskRequest;
import com.megrow.megrowbackend.dto.request.UpdateTaskStatusRequest;
import com.megrow.megrowbackend.dto.response.SurpriseTaskOptionsResponse;
import com.megrow.megrowbackend.dto.response.TaskResponse;
import com.megrow.megrowbackend.entities.*;
import com.megrow.megrowbackend.enums.GoalStatus;
import com.megrow.megrowbackend.enums.TaskSource;
import com.megrow.megrowbackend.enums.TaskStatus;
import com.megrow.megrowbackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskTimeSessionRepository  taskTimeSessionRepository;
    private final UserRepository userRepository;
    private final UserStatsService userStatsService;
    private final SurpriseTaskOptionRepository surpriseTaskOptionRepository;
    private final GoalBacklogItemRepository goalBacklogItemRepository;
    private final GoalRepository goalRepository;
    private final UserProfileRepository userProfileRepository;
    private final AiBacklogService aiBacklogService;

    @Transactional
    public TaskResponse createTask(CreateTaskRequest request) {
        User user = getCurrentUser();

        Task parentTask = null;
        if (request.getParentTaskId() != null) {
            parentTask = taskRepository.findById(request.getParentTaskId())
                    .orElseThrow(() -> new RuntimeException("Parent task not found"));

            if (!parentTask.getUser().getId().equals(user.getId()) ) {
                throw new RuntimeException("Access denied");
            }

            if (parentTask.getSource() != TaskSource.MANUAL ) {
                throw new RuntimeException("Subtasks can only be added to manual tasks");
            }
        }

        Task task = Task.builder()
                .user(user)
                .parentTask(parentTask)
                .source(TaskSource.MANUAL)
                .title(request.getTitle())
                .description(request.getDescription())
                .difficulty(request.getDifficulty())
                .priority(request.getPriority())
                .estimatedMinutes(request.getEstimatedMinutes())
                .scheduledDate(request.getScheduledDate())
                .deadlineAt(request.getDeadlineAt())
                .status(TaskStatus.TODO)
                .build();
        taskRepository.save(task);
        return mapToResponse(task);
    }

    public List<TaskResponse> getTodayTasks() {
        User user = getCurrentUser();
        return taskRepository.findByUserIdAndScheduledDateAndParentTaskIsNull(
                user.getId(), LocalDate.now())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskResponse getTaskById(UUID id) {
        User user = getCurrentUser();
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        return mapToResponse(task);
    }

    public List<TaskResponse> getSubtasks(UUID parentTaskId) {
        User user = getCurrentUser();
        Task parentTask = taskRepository.findById(parentTaskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!parentTask.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        return taskRepository.findByParentTaskId(parentTaskId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskResponse updateTaskStatus(UUID id, UpdateTaskStatusRequest request) {
        User user = getCurrentUser();
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        task.setStatus(request.getStatus());

        if (request.getStatus() == TaskStatus.DONE) {
            task.setCompletedAt(OffsetDateTime.now());
            taskTimeSessionRepository.findByTaskIdAndEndedAtIsNull(id)
                    .ifPresent(session -> {
                        session.setEndedAt(OffsetDateTime.now());
                        taskTimeSessionRepository.save(session);
                    });

            userStatsService.awardXPForTasks(user, task);

            if (task.getBacklogItem() != null) {
                GoalBacklogItem backlogItem = task.getBacklogItem();
                backlogItem.setCompleted(true);
                backlogItem.setCompletedAt(OffsetDateTime.now());
                goalBacklogItemRepository.save(backlogItem);

                Goal goal = backlogItem.getGoal();
                short currentPhase = backlogItem.getPhase();

                long totalItems = goalBacklogItemRepository.countByGoalId(goal.getId());
                long completedItems = goalBacklogItemRepository.countByGoalIdAndIsCompletedTrue(goal.getId());

                if (totalItems > 0 && totalItems == completedItems) {
                    goal.setStatus(GoalStatus.COMPLETED);
                    goalRepository.save(goal);
                } else {
                    long remainingInPhase = goalBacklogItemRepository
                            .countByGoalIdAndPhaseAndIsCompletedFalse(goal.getId(), currentPhase);

                    if (remainingInPhase <= 3 && currentPhase < 3) {
                        long nextPhaseItems = goalBacklogItemRepository
                                .countByGoalIdAndPhase(goal.getId(), (short)(currentPhase + 1));

                        if (nextPhaseItems == 0) {
                            UserProfile profile = userProfileRepository.findById(goal.getUser().getId())
                                    .orElseThrow(() -> new RuntimeException("Profile not found"));
                            List<GoalBacklogItem> newItems = aiBacklogService
                                    .generatePhase(goal, profile, currentPhase + 1);

                            short maxOrderIndex = goalBacklogItemRepository
                                    .findMaxOrderIndexByGoalId(goal.getId())
                                    .orElse((short) 0);

                            for (GoalBacklogItem item : newItems) {
                                item.setOrderIndex((short) (item.getOrderIndex() + maxOrderIndex));
                            }

                            newItems.forEach(goalBacklogItemRepository::save);
                        }
                    }
                }
            }

            if (task.getParentTask() != null) {
                Task parentTask = task.getParentTask();
                List<Task> subtasks = taskRepository.findByParentTaskId(parentTask.getId());
                boolean allDone = subtasks.stream()
                        .allMatch(subtask -> subtask.getId().equals(id) || subtask.getStatus() == TaskStatus.DONE);

                if (allDone) {
                    parentTask.setStatus(TaskStatus.DONE);
                    parentTask.setCompletedAt(OffsetDateTime.now());
                    taskRepository.save(parentTask);
                }
            }
        }

        taskRepository.save(task);
        return mapToResponse(task);
    }

    @Transactional
    public TaskResponse startTask(UUID id) {
        User user = getCurrentUser();
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        if (task.getStatus() == TaskStatus.DONE) {
            throw new RuntimeException("Task is already completed");
        }

        taskTimeSessionRepository.findByTaskIdAndEndedAtIsNull(id)
                .ifPresent(session -> {
                    throw new RuntimeException("Task is already running");
                });

        if (task.getStartedAt() == null) {
            task.setStartedAt(OffsetDateTime.now());
        }

        task.setStatus(TaskStatus.IN_PROGRESS);
        taskRepository.save(task);

        TaskTimeSession session = TaskTimeSession.builder()
                .task(task)
                .startedAt(OffsetDateTime.now())
                .build();
        taskTimeSessionRepository.save(session);

        return mapToResponse(task);
    }

    @Transactional
    public TaskResponse pauseTask(UUID id) {
        User user = getCurrentUser();
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        TaskTimeSession session = taskTimeSessionRepository
                .findByTaskIdAndEndedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Task is not running"));

        session.setEndedAt(OffsetDateTime.now());
        taskTimeSessionRepository.save(session);

        task.setStatus(TaskStatus.TODO);
        taskRepository.save(task);

        return mapToResponse(task);
    }

    @Transactional
    public SurpriseTaskOptionsResponse getSurpriseOptions(UUID taskId) {
        User user = getCurrentUser();
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        if (!task.isSurprise()) {
            throw new RuntimeException("Task is not a surprise task");
        }

        List<SurpriseTaskOption> options = surpriseTaskOptionRepository.findByTaskId(taskId);
        if (options.size() < 2) {
            throw new RuntimeException("Surprise options not found");
        }

        GoalBacklogItem item1 = options.get(0).getBacklogItem();
        GoalBacklogItem item2 = options.get(1).getBacklogItem();

        return new SurpriseTaskOptionsResponse(
                item1.getId(), item1.getTitle(), item1.getItemType(), item1.getEstimatedMinutes(),
                item2.getId(), item2.getTitle(), item2.getItemType(), item2.getEstimatedMinutes()
        );
    }

    @Transactional
    public TaskResponse chooseSurpriseTask(UUID taskId, ChooseSurpriseTaskRequest request) {
        User user = getCurrentUser();
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        if (!task.isSurprise()) {
            throw new RuntimeException("Task is not a surprise task");
        }

        GoalBacklogItem chosenItem = goalBacklogItemRepository.findById(request.getBacklogItemId())
                .orElseThrow(() -> new RuntimeException("Backlog item not found"));

        task.setTitle(chosenItem.getTitle());
        task.setBacklogItem(chosenItem);
        task.setSurprise(false);
        task.setEstimatedMinutes(chosenItem.getEstimatedMinutes());
        taskRepository.save(task);

        surpriseTaskOptionRepository.deleteByTaskId(taskId);

        return mapToResponse(task);
    }

    private TaskResponse mapToResponse(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getSource(),
                task.getStatus(),
                task.getPriority(),
                task.getDifficulty(),
                task.getEstimatedMinutes(),
                task.getScheduledDate(),
                task.getDeadlineAt(),
                task.getStartedAt(),
                task.getCompletedAt(),
                task.getCreatedAt(),
                task.getParentTask() != null ? task.getParentTask().getId() : null,
                task.getGoal() != null ? task.getGoal().getId() : null,
                task.isSurprise(),
                task.getBacklogItem() != null ? task.getBacklogItem().getDetails() : null
        );
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
