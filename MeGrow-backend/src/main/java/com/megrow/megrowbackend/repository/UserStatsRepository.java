package com.megrow.megrowbackend.repository;

import com.megrow.megrowbackend.entities.UserStats;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserStatsRepository extends JpaRepository<UserStats, UUID> {
}
