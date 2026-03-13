package com.megrow.megrowbackend.repository;

import com.megrow.megrowbackend.entities.GoalFitnessDetails;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface GoalFitnessDetailsRepository extends JpaRepository<GoalFitnessDetails, UUID> {
}
