package com.megrow.megrowbackend.repository;

import com.megrow.megrowbackend.entities.TaskTimeSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskTimeSessionRepository extends JpaRepository<TaskTimeSession, UUID> {
    List<TaskTimeSession> findByTaskId(UUID taskId);
    Optional<TaskTimeSession> findByTaskIdAndEndedAtIsNull(UUID taskId);
}
