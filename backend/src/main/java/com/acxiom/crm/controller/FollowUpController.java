package com.acxiom.crm.controller;

import com.acxiom.crm.dto.*;
import com.acxiom.crm.entity.FollowUpStatus;
import com.acxiom.crm.entity.FollowUpType;
import com.acxiom.crm.security.CurrentUser;
import com.acxiom.crm.security.UserPrincipal;
import com.acxiom.crm.service.FollowUpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/followups")
@Tag(name = "Follow-Up Management", description = "Endpoints for scheduling, rescheduling, completing, and tracking customer & lead follow-ups")
public class FollowUpController {

    private final FollowUpService followUpService;

    public FollowUpController(FollowUpService followUpService) {
        this.followUpService = followUpService;
    }

    @GetMapping
    @Operation(summary = "Search follow-ups with status, type, and date filters")
    public ResponseEntity<ApiResponse<PagedResponse<FollowUpResponse>>> getFollowUps(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) FollowUpStatus status,
            @RequestParam(required = false) FollowUpType type,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long leadId,
            @RequestParam(required = false) Long opportunityId,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate,
            @CurrentUser UserPrincipal currentUser,
            @PageableDefault(size = 10, sort = "followUpDate", direction = Sort.Direction.ASC) Pageable pageable) {
        PagedResponse<FollowUpResponse> response = followUpService.searchFollowUps(
                query, status, type, customerId, leadId, opportunityId, startDate, endDate, currentUser, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/upcoming")
    @Operation(summary = "Get upcoming planned follow-ups")
    public ResponseEntity<ApiResponse<List<FollowUpResponse>>> getUpcomingFollowUps(
            @RequestParam(defaultValue = "10") int limit,
            @CurrentUser UserPrincipal currentUser) {
        List<FollowUpResponse> list = followUpService.getUpcomingFollowUps(currentUser, limit);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/overdue")
    @Operation(summary = "Get overdue follow-ups requiring prompt attention")
    public ResponseEntity<ApiResponse<List<FollowUpResponse>>> getOverdueFollowUps(
            @RequestParam(defaultValue = "10") int limit,
            @CurrentUser UserPrincipal currentUser) {
        List<FollowUpResponse> list = followUpService.getOverdueFollowUps(currentUser, limit);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get follow-up details by ID")
    public ResponseEntity<ApiResponse<FollowUpResponse>> getFollowUpById(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        FollowUpResponse response = followUpService.getFollowUpById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @Operation(summary = "Schedule a new Follow-Up")
    public ResponseEntity<ApiResponse<FollowUpResponse>> createFollowUp(
            @Valid @RequestBody FollowUpRequest request,
            @CurrentUser UserPrincipal currentUser) {
        FollowUpResponse response = followUpService.createFollowUp(request, currentUser);
        return new ResponseEntity<>(ApiResponse.ok("Follow-up scheduled successfully", response), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Reschedule or update an existing Follow-Up")
    public ResponseEntity<ApiResponse<FollowUpResponse>> updateFollowUp(
            @PathVariable Long id,
            @Valid @RequestBody FollowUpRequest request,
            @CurrentUser UserPrincipal currentUser) {
        FollowUpResponse updated = followUpService.updateFollowUp(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Follow-up updated successfully", updated));
    }

    @PatchMapping("/{id}/complete")
    @Operation(summary = "Mark Follow-Up as completed with outcome notes")
    public ResponseEntity<ApiResponse<FollowUpResponse>> completeFollowUp(
            @PathVariable Long id,
            @RequestBody(required = false) CompleteFollowUpRequest request,
            @CurrentUser UserPrincipal currentUser) {
        FollowUpResponse updated = followUpService.completeFollowUp(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Follow-up completed successfully", updated));
    }
}
