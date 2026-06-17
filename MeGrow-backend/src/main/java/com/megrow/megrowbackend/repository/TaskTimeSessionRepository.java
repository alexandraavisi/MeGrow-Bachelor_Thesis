package com.megrow.megrowbackend.repository;

import com.megrow.megrowbackend.entities.TaskTimeSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskTimeSessionRepository extends JpaRepository<TaskTimeSession, UUID> {
    List<TaskTimeSession> findByTaskId(UUID taskId);
    Optional<TaskTimeSession> findByTaskIdAndEndedAtIsNull(UUID taskId);

    @Query("SELECT COALESCE(SUM(t.durationSeconds), 0) FROM TaskTimeSession t " +
            "WHERE t.task.user.id = :userId AND t.durationSeconds IS NOT NULL")
    Long sumDurationSecondsByUserId(@Param("userId") UUID userId);
}
