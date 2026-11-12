package com.acxiom.crm.controller;

import com.acxiom.crm.dto.*;
import com.acxiom.crm.entity.CustomerStatus;
import com.acxiom.crm.security.CurrentUser;
import com.acxiom.crm.security.UserPrincipal;
import com.acxiom.crm.service.CustomerService;
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
@RequestMapping("/api/customers")
@Tag(name = "Customer Management", description = "Endpoints for Customer CRUD, Search, and 360-degree Profiles")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    @Operation(summary = "Search customers with filtering, sorting, and pagination")
    public ResponseEntity<ApiResponse<PagedResponse<CustomerResponse>>> getCustomers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) CustomerStatus status,
            @CurrentUser UserPrincipal currentUser,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        String searchTerm = (query != null && !query.isBlank()) ? query : search;
        PagedResponse<CustomerResponse> customers = customerService.searchCustomers(searchTerm, status, currentUser, pageable);
        return ResponseEntity.ok(ApiResponse.ok(customers));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get customer details by ID")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerById(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        CustomerResponse customer = customerService.getCustomerById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(customer));
    }

    @GetMapping("/{id}/360")
    @Operation(summary = "Get Customer 360-degree Profile including related Leads, Deals, Tasks, and Audit history")
    public ResponseEntity<ApiResponse<Customer360Response>> getCustomer360(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        Customer360Response profile = customerService.getCustomer360(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PostMapping
    @Operation(summary = "Create a new Customer")
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(
            @Valid @RequestBody CustomerRequest request,
            @CurrentUser UserPrincipal currentUser) {
        CustomerResponse customer = customerService.createCustomer(request, currentUser);
        return new ResponseEntity<>(ApiResponse.ok("Customer created successfully", customer), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing Customer")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody CustomerRequest request,
            @CurrentUser UserPrincipal currentUser) {
        CustomerResponse updated = customerService.updateCustomer(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Customer updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate/archive a Customer")
    public ResponseEntity<ApiResponse<String>> deleteCustomer(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        customerService.deleteCustomer(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Customer deactivated successfully", "Customer status updated to INACTIVE"));
    }
}

