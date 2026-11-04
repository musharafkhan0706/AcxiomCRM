package com.acxiom.crm.controller;

import com.acxiom.crm.dto.*;
import com.acxiom.crm.security.CurrentUser;
import com.acxiom.crm.security.UserPrincipal;
import com.acxiom.crm.service.AuthService;
import com.acxiom.crm.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints for user authentication, registration, token refresh, and logout")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user with email and password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request,
                                                           HttpServletRequest httpRequest) {
        AuthResponse response = authService.login(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user account")
    public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest request,
                                                              HttpServletRequest httpRequest) {
        UserResponse user = authService.register(request, httpRequest);
        return new ResponseEntity<>(ApiResponse.ok("Registration successful", user), HttpStatus.CREATED);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh expired access token using valid refresh token")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request,
                                                             HttpServletRequest httpRequest) {
        AuthResponse response = authService.refreshToken(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.ok("Token refreshed successfully", response));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout active session and revoke refresh token")
    public ResponseEntity<ApiResponse<String>> logout(@RequestBody(required = false) RefreshTokenRequest request,
                                                      @CurrentUser UserPrincipal currentUser,
                                                      HttpServletRequest httpRequest) {
        String token = request != null ? request.getRefreshToken() : null;
        authService.logout(token, currentUser, httpRequest);
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully", "Session revoked"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(@CurrentUser UserPrincipal currentUser) {
        UserResponse response = userService.getUserById(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password for authenticated user")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                                              @CurrentUser UserPrincipal currentUser,
                                                              HttpServletRequest httpRequest) {
        authService.changePassword(currentUser.getId(), request, httpRequest);
        return ResponseEntity.ok(ApiResponse.ok("Password changed successfully", "Password updated"));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset link via email")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request,
                                                              HttpServletRequest httpRequest) {
        authService.forgotPassword(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.ok("If that email address is registered, a password recovery link has been sent.", "Recovery email initiated"));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using secure recovery token")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordWithTokenRequest request,
                                                             HttpServletRequest httpRequest) {
        authService.resetPasswordWithToken(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.ok("Password has been reset successfully. You can now log in with your new password.", "Password reset complete"));
    }
}

