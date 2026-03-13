package com.megrow.megrowbackend.repository;

import com.megrow.megrowbackend.entities.HabitTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HabitTemplateRepository extends JpaRepository<HabitTemplate, UUID> {
    List<HabitTemplate> findByIsActiveTrue();
    List<HabitTemplate> findByUserIdIsNull();
    List<HabitTemplate> findByUserId(UUID userId);
    Optional<HabitTemplate> findByCode(String code);
}
