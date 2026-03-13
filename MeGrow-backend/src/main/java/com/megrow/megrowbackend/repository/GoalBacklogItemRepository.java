package com.megrow.megrowbackend.repository;

import com.megrow.megrowbackend.entities.GoalBacklogItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GoalBacklogItemRepository extends JpaRepository<GoalBacklogItem, UUID> {
    List<GoalBacklogItem> findByGoalIdOrderByOrderIndexAsc(UUID goalId);

    @Query("SELECT g FROM GoalBacklogItem g WHERE g.goal.id = :goalId AND g.isCompleted = false  ORDER BY g.orderIndex ASC ")
    Optional<GoalBacklogItem> findNextPending(UUID goalId);
}
