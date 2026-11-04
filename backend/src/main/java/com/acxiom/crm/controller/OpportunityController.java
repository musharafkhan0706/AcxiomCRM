package com.acxiom.crm.controller;

import com.acxiom.crm.dto.*;
import com.acxiom.crm.entity.OpportunityStage;
import com.acxiom.crm.entity.OpportunityStatus;
import com.acxiom.crm.security.CurrentUser;
import com.acxiom.crm.security.UserPrincipal;
import com.acxiom.crm.service.OpportunityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/opportunities")
@Tag(name = "Opportunity Management", description = "Endpoints for Deal tracking, Kanban pipeline, weighted forecasting, and Won/Lost outcomes")
public class OpportunityController {

    private final OpportunityService opportunityService;

    public OpportunityController(OpportunityService opportunityService) {
        this.opportunityService = opportunityService;
    }

    @GetMapping
    @Operation(summary = "Search opportunities with stage, customer, and owner filters")
    public ResponseEntity<ApiResponse<PagedResponse<OpportunityResponse>>> getOpportunities(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) OpportunityStage stage,
            @RequestParam(required = false) OpportunityStatus status,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long assignedUserId,
            @CurrentUser UserPrincipal currentUser,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PagedResponse<OpportunityResponse> response = opportunityService.searchOpportunities(
                query, stage, status, customerId, assignedUserId, currentUser, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/pipeline-summary")
    @Operation(summary = "Get overall sales pipeline value, weighted pipeline, and stage breakdown")
    public ResponseEntity<ApiResponse<PipelineSummaryResponse>> getPipelineSummary(@CurrentUser UserPrincipal currentUser) {
        PipelineSummaryResponse summary = opportunityService.getPipelineSummary(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get opportunity details by ID")
    public ResponseEntity<ApiResponse<OpportunityResponse>> getOpportunityById(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        OpportunityResponse opp = opportunityService.getOpportunityById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(opp));
    }

    @PostMapping
    @Operation(summary = "Create a new Opportunity")
    public ResponseEntity<ApiResponse<OpportunityResponse>> createOpportunity(
            @Valid @RequestBody OpportunityRequest request,
            @CurrentUser UserPrincipal currentUser) {
        OpportunityResponse response = opportunityService.createOpportunity(request, currentUser);
        return new ResponseEntity<>(ApiResponse.ok("Opportunity created successfully", response), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing Opportunity")
    public ResponseEntity<ApiResponse<OpportunityResponse>> updateOpportunity(
            @PathVariable Long id,
            @Valid @RequestBody OpportunityRequest request,
            @CurrentUser UserPrincipal currentUser) {
        OpportunityResponse updated = opportunityService.updateOpportunity(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Opportunity updated successfully", updated));
    }

    @PatchMapping("/{id}/stage")
    @Operation(summary = "Update opportunity pipeline stage (supports Kanban board movement)")
    public ResponseEntity<ApiResponse<OpportunityResponse>> updateStage(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStageRequest request,
            @CurrentUser UserPrincipal currentUser) {
        OpportunityResponse updated = opportunityService.updateStage(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Stage updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Mark Opportunity as Lost/archived")
    public ResponseEntity<ApiResponse<String>> deleteOpportunity(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        opportunityService.deleteOpportunity(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Opportunity archived", "Stage updated to LOST"));
    }
}
