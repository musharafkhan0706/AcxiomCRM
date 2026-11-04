package com.acxiom.crm.controller;

import com.acxiom.crm.dto.ApiResponse;
import com.acxiom.crm.dto.DashboardMetricsResponse;
import com.acxiom.crm.security.CurrentUser;
import com.acxiom.crm.security.UserPrincipal;
import com.acxiom.crm.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard", description = "Endpoints for role-based CRM KPI cards, Chart.js metrics, and summary widgets")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    @Operation(summary = "Get role-scoped dashboard metrics, charts, and quick widgets with date range filtering")
    public ResponseEntity<ApiResponse<DashboardMetricsResponse>> getDashboard(
            @RequestParam(defaultValue = "ALL") String period,
            @RequestParam(required = false) Instant customStart,
            @RequestParam(required = false) Instant customEnd,
            @CurrentUser UserPrincipal currentUser) {
        DashboardMetricsResponse metrics = dashboardService.getDashboardMetrics(currentUser, period, customStart, customEnd);
        return ResponseEntity.ok(ApiResponse.ok(metrics));
    }
}

