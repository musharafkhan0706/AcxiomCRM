package com.acxiom.crm.controller;

import com.acxiom.crm.dto.*;
import com.acxiom.crm.entity.RoleName;
import com.acxiom.crm.security.CurrentUser;
import com.acxiom.crm.security.UserPrincipal;
import com.acxiom.crm.service.AuthService;
import com.acxiom.crm.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@Tag(name = "User and Role Management", description = "Admin-only endpoints for user administration, role assignment, lockout management, and account activation")
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    public UserController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Search users with role and status filtering (Admin only)")
    public ResponseEntity<ApiResponse<PagedResponse<UserResponse>>> getUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) RoleName role,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PagedResponse<UserResponse> response = userService.searchUsers(query, role, isActive, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/assignable")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get list of active users available for task and record assignment")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAssignableUsers() {
        List<UserResponse> users = userService.getAssignableUsers();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get user details by ID (Admin only)")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new user account (Admin only)")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody UserRequest request,
            @CurrentUser UserPrincipal admin) {
        UserResponse response = userService.createUser(request, admin);
        return new ResponseEntity<>(ApiResponse.ok("User created successfully", response), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update an existing user (Admin only)")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserRequest request,
            @CurrentUser UserPrincipal admin) {
        UserResponse updated = userService.updateUser(id, request, admin);
        return ResponseEntity.ok(ApiResponse.ok("User updated successfully", updated));
    }

    @RequestMapping(value = "/{id}/role", method = { RequestMethod.PATCH, RequestMethod.PUT })
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Assign a role to a user (Admin only)")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request,
            @CurrentUser UserPrincipal admin) {
        UserResponse updated = userService.updateUserRole(id, request, admin);
        return ResponseEntity.ok(ApiResponse.ok("User role updated successfully", updated));
    }

    @RequestMapping(value = {"/{id}/toggle-active", "/{id}/status"}, method = {RequestMethod.PATCH, RequestMethod.POST, RequestMethod.PUT})
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activate or deactivate a user account (Admin only)")
    public ResponseEntity<ApiResponse<UserResponse>> toggleUserActive(
            @PathVariable Long id,
            @RequestParam(required = false) Boolean active,
            @CurrentUser UserPrincipal admin) {
        UserResponse updated = (active != null)
                ? userService.setUserActive(id, active, admin)
                : userService.toggleUserActive(id, admin);
        return ResponseEntity.ok(ApiResponse.ok("User status updated", updated));
    }

    @RequestMapping(value = "/{id}/unlock", method = {RequestMethod.PATCH, RequestMethod.POST, RequestMethod.PUT})
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Manually unlock a locked user account (Admin only)")
    public ResponseEntity<ApiResponse<UserResponse>> unlockUser(
            @PathVariable Long id,
            @CurrentUser UserPrincipal admin) {
        UserResponse updated = userService.unlockUser(id, admin);
        return ResponseEntity.ok(ApiResponse.ok("User account unlocked", updated));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Securely reset user password (Admin only)")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordRequest request,
            @CurrentUser UserPrincipal admin,
            HttpServletRequest httpRequest) {
        authService.resetPassword(id, request, admin, httpRequest);
        return ResponseEntity.ok(ApiResponse.ok("Password reset successfully", "Password updated"));
    }
}
