package com.megrow.megrowbackend.repository;

import com.megrow.megrowbackend.entities.SurpriseTaskOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SurpriseTaskOptionRepository extends JpaRepository<SurpriseTaskOption, UUID> {
    List<SurpriseTaskOption> findByTaskId(UUID taskId);
    void deleteByTaskId(UUID taskId);
}
