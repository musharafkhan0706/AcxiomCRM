package com.acxiom.crm.controller;

import com.acxiom.crm.dto.ApiResponse;
import com.acxiom.crm.dto.AuditLogResponse;
import com.acxiom.crm.dto.PagedResponse;
import com.acxiom.crm.dto.PipelineSummaryResponse;
import com.acxiom.crm.security.CurrentUser;
import com.acxiom.crm.security.UserPrincipal;
import com.acxiom.crm.service.OpportunityService;
import com.acxiom.crm.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Reports and Analytics", description = "Endpoints for generating role-scoped CRM reports, sales analytics, and audit extracts")
public class ReportController {

    private final ReportService reportService;
    private final OpportunityService opportunityService;

    public ReportController(ReportService reportService, OpportunityService opportunityService) {
        this.reportService = reportService;
        this.opportunityService = opportunityService;
    }

    @GetMapping("/customers")
    @Operation(summary = "Get Customer acquisition and status report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCustomerReport(
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate,
            @CurrentUser UserPrincipal currentUser) {
        Map<String, Object> report = reportService.getCustomerReport(currentUser, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/leads")
    @Operation(summary = "Get Lead source and qualification status report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLeadReport(
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate,
            @CurrentUser UserPrincipal currentUser) {
        Map<String, Object> report = reportService.getLeadReport(currentUser, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/opportunities")
    @Operation(summary = "Get Sales Opportunities performance report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOpportunityReport(
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate,
            @CurrentUser UserPrincipal currentUser) {
        Map<String, Object> report = reportService.getOpportunityReport(currentUser, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/pipeline")
    @Operation(summary = "Get overall Sales Pipeline Summary report")
    public ResponseEntity<ApiResponse<PipelineSummaryResponse>> getPipelineReport(@CurrentUser UserPrincipal currentUser) {
        PipelineSummaryResponse summary = opportunityService.getPipelineSummary(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/followups")
    @Operation(summary = "Get Follow-Up completion and schedule report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFollowUpReport(
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate,
            @CurrentUser UserPrincipal currentUser) {
        Map<String, Object> report = reportService.getFollowUpReport(currentUser, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/conversions")
    @Operation(summary = "Get Lead-to-Customer conversion analytics and win rates")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConversionReport(
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate,
            @CurrentUser UserPrincipal currentUser) {
        Map<String, Object> report = reportService.getConversionReport(currentUser, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/audit")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Get system Audit Report (Admin and Manager only)")
    public ResponseEntity<ApiResponse<PagedResponse<AuditLogResponse>>> getAuditReport(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityName,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate,
            @PageableDefault(size = 20, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        PagedResponse<AuditLogResponse> response = reportService.getAuditReport(query, action, entityName, userId, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}

