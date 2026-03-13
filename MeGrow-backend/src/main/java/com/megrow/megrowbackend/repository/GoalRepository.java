package com.megrow.megrowbackend.repository;

import com.megrow.megrowbackend.entities.Goal;
import com.megrow.megrowbackend.enums.GoalStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GoalRepository extends JpaRepository<Goal, UUID> {
    List<Goal> findByUserId(UUID userId);
    List<Goal> findByUserIdAndStatus(UUID userId, GoalStatus status);
    int countByUserIdAndStatus(UUID userId, GoalStatus status);
}
