package com.megrow.megrowbackend.repository;

import com.megrow.megrowbackend.entities.HabitLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface HabitLogRepository extends JpaRepository<HabitLog, UUID> {
    List<HabitLog> findByUserIdAndLogDate(UUID userId, LocalDate date);
    boolean existsByUserIdAndHabitTemplateIdAndLogDate(UUID userId, UUID habitLogId, LocalDate date);
}
