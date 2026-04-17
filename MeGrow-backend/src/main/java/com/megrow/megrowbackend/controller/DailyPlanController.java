package com.megrow.megrowbackend.controller;

import com.megrow.megrowbackend.dto.response.DailyPlanResponse;
import com.megrow.megrowbackend.service.DailyPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/daily-plan")
@RequiredArgsConstructor
public class DailyPlanController {
    private final DailyPlanService dailyPlanService;

    @GetMapping("/today")
    public ResponseEntity<DailyPlanResponse> getTodayPlan(){
        return ResponseEntity.ok(dailyPlanService.getTodayPlan());
    }
}
