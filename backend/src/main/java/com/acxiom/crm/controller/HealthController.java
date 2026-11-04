package com.acxiom.crm.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@Tag(name = "Health", description = "Application health and status endpoints")
public class HealthController {

    @GetMapping({"/actuator/health", "/api/health"})
    @Operation(summary = "Check application service health status")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "application", "AcxiomCRM",
                "version", "1.0.0",
                "timestamp", System.currentTimeMillis()
        ));
    }
}
