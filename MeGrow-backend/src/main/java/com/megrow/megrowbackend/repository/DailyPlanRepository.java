package com.megrow.megrowbackend.repository;

import com.megrow.megrowbackend.entities.DailyPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface DailyPlanRepository extends JpaRepository<DailyPlan, UUID> {
    Optional<DailyPlan> findByUserIdAndPlanDate(UUID userId, LocalDate date);
}
