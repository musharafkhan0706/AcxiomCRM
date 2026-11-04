package com.acxiom.crm.controller;

import com.acxiom.crm.dto.*;
import com.acxiom.crm.entity.LeadSource;
import com.acxiom.crm.entity.LeadStatus;
import com.acxiom.crm.entity.Priority;
import com.acxiom.crm.security.CurrentUser;
import com.acxiom.crm.security.UserPrincipal;
import com.acxiom.crm.service.LeadService;
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
@RequestMapping("/api/leads")
@Tag(name = "Lead Management", description = "Endpoints for Lead tracking, pipeline qualification, assignment, and conversion")
public class LeadController {

    private final LeadService leadService;

    public LeadController(LeadService leadService) {
        this.leadService = leadService;
    }

    @GetMapping
    @Operation(summary = "Search leads with filtering by status, priority, source, and assigned user")
    public ResponseEntity<ApiResponse<PagedResponse<LeadResponse>>> getLeads(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) LeadStatus status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) LeadSource source,
            @RequestParam(required = false) Long assignedUserId,
            @CurrentUser UserPrincipal currentUser,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PagedResponse<LeadResponse> leads = leadService.searchLeads(query, status, priority, source, assignedUserId, currentUser, pageable);
        return ResponseEntity.ok(ApiResponse.ok(leads));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get lead details by ID")
    public ResponseEntity<ApiResponse<LeadResponse>> getLeadById(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        LeadResponse lead = leadService.getLeadById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(lead));
    }

    @PostMapping
    @Operation(summary = "Create a new Lead")
    public ResponseEntity<ApiResponse<LeadResponse>> createLead(
            @Valid @RequestBody LeadRequest request,
            @CurrentUser UserPrincipal currentUser) {
        LeadResponse lead = leadService.createLead(request, currentUser);
        return new ResponseEntity<>(ApiResponse.ok("Lead created successfully", lead), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing Lead")
    public ResponseEntity<ApiResponse<LeadResponse>> updateLead(
            @PathVariable Long id,
            @Valid @RequestBody LeadRequest request,
            @CurrentUser UserPrincipal currentUser) {
        LeadResponse updated = leadService.updateLead(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Lead updated successfully", updated));
    }

    @PostMapping("/{id}/assign")
    @Operation(summary = "Reassign Lead to a sales executive or manager")
    public ResponseEntity<ApiResponse<LeadResponse>> assignLead(
            @PathVariable Long id,
            @Valid @RequestBody AssignLeadRequest request,
            @CurrentUser UserPrincipal currentUser) {
        LeadResponse updated = leadService.assignLead(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Lead assigned successfully", updated));
    }

    @PostMapping("/{id}/convert")
    @Operation(summary = "Convert qualified Lead into Customer and Sales Opportunity")
    public ResponseEntity<ApiResponse<ConvertLeadResponse>> convertLead(
            @PathVariable Long id,
            @Valid @RequestBody ConvertLeadRequest request,
            @CurrentUser UserPrincipal currentUser) {
        ConvertLeadResponse response = leadService.convertLead(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Lead converted successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Archive/mark Lead as Lost")
    public ResponseEntity<ApiResponse<String>> deleteLead(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        leadService.deleteLead(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Lead archived", "Lead marked as LOST"));
    }
}

