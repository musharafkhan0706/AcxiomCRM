package com.acxiom.crm.controller;

import com.acxiom.crm.dto.*;
import com.acxiom.crm.entity.ActivityStatus;
import com.acxiom.crm.entity.ActivityType;
import com.acxiom.crm.security.CurrentUser;
import com.acxiom.crm.security.UserPrincipal;
import com.acxiom.crm.service.ActivityService;
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
@RequestMapping("/api/activities")
@Tag(name = "Activity Management", description = "Endpoints for logging sales activities including Calls, Meetings, Emails, and Tasks")
public class ActivityController {

    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @GetMapping
    @Operation(summary = "Search activities with type, status, and related entity filters")
    public ResponseEntity<ApiResponse<PagedResponse<ActivityResponse>>> getActivities(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) ActivityStatus status,
            @RequestParam(required = false) ActivityType type,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long leadId,
            @RequestParam(required = false) Long opportunityId,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate,
            @CurrentUser UserPrincipal currentUser,
            @PageableDefault(size = 10, sort = "activityDate", direction = Sort.Direction.DESC) Pageable pageable) {
        PagedResponse<ActivityResponse> response = activityService.searchActivities(
                query, status, type, customerId, leadId, opportunityId, startDate, endDate, currentUser, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/recent")
    @Operation(summary = "Get recent logged activities")
    public ResponseEntity<ApiResponse<List<ActivityResponse>>> getRecentActivities(
            @RequestParam(defaultValue = "10") int limit,
            @CurrentUser UserPrincipal currentUser) {
        List<ActivityResponse> list = activityService.getRecentActivities(currentUser, limit);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get activity details by ID")
    public ResponseEntity<ApiResponse<ActivityResponse>> getActivityById(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        ActivityResponse response = activityService.getActivityById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @Operation(summary = "Log a new Activity")
    public ResponseEntity<ApiResponse<ActivityResponse>> createActivity(
            @Valid @RequestBody ActivityRequest request,
            @CurrentUser UserPrincipal currentUser) {
        ActivityResponse response = activityService.createActivity(request, currentUser);
        return new ResponseEntity<>(ApiResponse.ok("Activity logged successfully", response), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing Activity")
    public ResponseEntity<ApiResponse<ActivityResponse>> updateActivity(
            @PathVariable Long id,
            @Valid @RequestBody ActivityRequest request,
            @CurrentUser UserPrincipal currentUser) {
        ActivityResponse updated = activityService.updateActivity(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Activity updated successfully", updated));
    }
}

