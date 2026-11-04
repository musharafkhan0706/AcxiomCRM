package com.acxiom.crm.controller;

import com.acxiom.crm.audit.AuditService;
import com.acxiom.crm.dto.ApiResponse;
import com.acxiom.crm.dto.AuditLogResponse;
import com.acxiom.crm.dto.PagedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping({"/api/audit", "/api/audit-logs"})
@Tag(name = "Audit Logging", description = "Endpoints for searching and auditing system access, data modifications, and security events")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AuditLogController {

    private final AuditService auditService;

    public AuditLogController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    @Operation(summary = "Search system audit logs with full filtering")
    public ResponseEntity<ApiResponse<PagedResponse<AuditLogResponse>>> getLogs(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityName,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate,
            @PageableDefault(size = 20, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        PagedResponse<AuditLogResponse> response = auditService.searchLogs(query, action, entityName, userId, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/history/{entityName}/{recordId}")
    @Operation(summary = "Get historical lifecycle audit trail for a specific CRM entity record")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getEntityHistory(
            @PathVariable String entityName,
            @PathVariable String recordId) {
        List<AuditLogResponse> history = auditService.getEntityHistory(entityName, recordId);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }
}

