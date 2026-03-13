package com.megrow.megrowbackend.repository;

import com.megrow.megrowbackend.entities.Task;
import com.megrow.megrowbackend.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByUserIdAndScheduledDate(UUID userId, LocalDate date);
    List<Task> findByUserIdAndScheduledDateAndParentTaskIsNull(UUID userId, LocalDate date);
    List<Task> findByParentTaskId(UUID parentTaskId);
    List<Task> findByUserIdAndStatus(UUID userId, TaskStatus status);

    @Query("SELECT COALESCE(SUM(t.estimatedMinutes), 0) FROM Task t " +
            "WHERE t.user.id = :userId AND t.scheduledDate = :date " +
            "AND t.parentTask IS NULL AND t.status != 'SKIPPED' ")
    int sumEstimatedMinutesForDay(UUID userId, LocalDate date);
}
