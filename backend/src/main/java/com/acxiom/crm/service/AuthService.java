package com.acxiom.crm.service;

import com.acxiom.crm.audit.AuditService;
import com.acxiom.crm.dto.*;
import com.acxiom.crm.entity.*;
import com.acxiom.crm.exception.*;
import com.acxiom.crm.repository.*;
import com.acxiom.crm.security.JwtTokenProvider;
import com.acxiom.crm.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final AuditService auditService;

    @Value("${acxiom.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    @Value("${acxiom.security.max-failed-attempts:5}")
    private int maxFailedAttempts;

    @Value("${acxiom.security.lockout-duration-minutes:15}")
    private int lockoutDurationMinutes;

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.auditService = auditService;
    }

    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String email = request.getEmail().trim().toLowerCase();
        String clientIp = getClientIp(httpRequest);

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
        if (userOpt.isEmpty()) {
            auditService.logEvent(null, email, "LOGIN_FAILURE", "AUTH", null,
                    null, null, "FAILURE", "Unknown user attempt: " + email, clientIp);
            throw new BadCredentialsException("Invalid email/username or password");
        }

        User user = userOpt.get();

        // 1. Check lockout status & automatic expiration of lockout
        if (user.isLocked()) {
            if (user.getLockoutTime() != null) {
                Duration lockedFor = Duration.between(user.getLockoutTime(), Instant.now());
                if (lockedFor.toMinutes() >= lockoutDurationMinutes) {
                    user.unlockAccount();
                    userRepository.save(user);
                    auditService.logEvent(user.getId(), user.getEmail(), "AUTO_UNLOCK", "USER",
                            user.getId().toString(), "LOCKED", "UNLOCKED", "SUCCESS",
                            "Lockout expired after " + lockoutDurationMinutes + " minutes", clientIp);
                } else {
                    long remainingMinutes = lockoutDurationMinutes - lockedFor.toMinutes();
                    auditService.logEvent(user.getId(), user.getEmail(), "LOGIN_LOCKED_ATTEMPT", "AUTH",
                            user.getId().toString(), null, null, "FAILURE",
                            "Attempted login on locked account", clientIp);
                    throw new AccountLockedException("Account is locked due to multiple failed login attempts. Try again in " + remainingMinutes + " minutes or contact administrator.");
                }
            } else {
                throw new AccountLockedException("Account is locked. Please contact system administrator.");
            }
        }

        if (!user.isActive()) {
            throw new InvalidOperationException("Account is deactivated. Please contact your manager or administrator.");
        }

        // 2. Authenticate
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );

            // Reset failed login counter on success
            user.resetFailedLogins();
            userRepository.save(user);

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            String accessToken = tokenProvider.generateAccessToken(userPrincipal);
            String refreshTokenStr = createRefreshToken(user);

            auditService.logEvent(user.getId(), user.getEmail(), "LOGIN_SUCCESS", "AUTH",
                    user.getId().toString(), null, null, "SUCCESS", "User authenticated successfully", clientIp);

            return new AuthResponse(
                    accessToken,
                    refreshTokenStr,
                    tokenProvider.getExpirationMs(),
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getRole().getName(),
                    user.getDepartment()
            );

        } catch (BadCredentialsException e) {
            user.incrementFailedLogins();
            if (user.getFailedLoginCount() >= maxFailedAttempts) {
                user.lockAccount();
                userRepository.save(user);
                auditService.logEvent(user.getId(), user.getEmail(), "LOCKOUT", "USER",
                        user.getId().toString(), "UNLOCKED", "LOCKED", "WARNING",
                        "Account locked due to " + maxFailedAttempts + " consecutive failed attempts", clientIp);
                throw new AccountLockedException("Account has been locked due to " + maxFailedAttempts + " failed attempts. Lockout period is " + lockoutDurationMinutes + " minutes.");
            } else {
                userRepository.save(user);
                auditService.logEvent(user.getId(), user.getEmail(), "LOGIN_FAILURE", "AUTH",
                        user.getId().toString(), null, null, "FAILURE",
                        "Failed attempt " + user.getFailedLoginCount() + " of " + maxFailedAttempts, clientIp);
            }
            throw new BadCredentialsException("Invalid email/username or password");
        }
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request, HttpServletRequest httpRequest) {
        String tokenStr = request.getRefreshToken();
        String clientIp = getClientIp(httpRequest);

        RefreshToken refreshToken = refreshTokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new TokenRefreshException("Refresh token not found"));

        User user = refreshToken.getUser();

        // Refresh token reuse detection: if revoked token presented, invalidate the entire token family
        if (refreshToken.isRevoked()) {
            refreshTokenRepository.revokeTokenFamily(refreshToken.getTokenFamily());
            auditService.logEvent(user.getId(), user.getEmail(), "TOKEN_REUSE_DETECTED", "AUTH",
                    user.getId().toString(), null, null, "SECURITY_ALERT",
                    "Suspicious refresh token reuse detected for family: " + refreshToken.getTokenFamily(), clientIp);
            throw new TokenRefreshException("Refresh token was revoked. Entire session invalidated for security.");
        }

        if (refreshToken.isExpired()) {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
            throw new TokenRefreshException("Refresh token has expired. Please log in again.");
        }

        if (!user.isActive() || user.isLocked()) {
            throw new TokenRefreshException("User account is inactive or locked.");
        }

        // Rotate token: revoke current token and generate a new one in the same token family
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        String newRefreshTokenStr = UUID.randomUUID().toString();
        Instant newExpiry = Instant.now().plusMillis(refreshExpirationMs);
        RefreshToken newRefreshToken = new RefreshToken(user, newRefreshTokenStr, refreshToken.getTokenFamily(), newExpiry);
        refreshTokenRepository.save(newRefreshToken);

        UserPrincipal userPrincipal = UserPrincipal.create(user);
        String newAccessToken = tokenProvider.generateAccessToken(userPrincipal);

        auditService.logEvent(user.getId(), user.getEmail(), "TOKEN_REFRESH", "AUTH",
                user.getId().toString(), null, null, "SUCCESS", "Access token rotated successfully", clientIp);

        return new AuthResponse(
                newAccessToken,
                newRefreshTokenStr,
                tokenProvider.getExpirationMs(),
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().getName(),
                user.getDepartment()
        );
    }

    @Transactional
    public void logout(String refreshTokenStr, UserPrincipal currentUser, HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        if (refreshTokenStr != null && !refreshTokenStr.isBlank()) {
            refreshTokenRepository.findByToken(refreshTokenStr).ifPresent(token -> {
                refreshTokenRepository.revokeTokenFamily(token.getTokenFamily());
            });
        }

        if (currentUser != null) {
            userRepository.findById(currentUser.getId()).ifPresent(refreshTokenRepository::revokeAllUserTokens);
            auditService.logEvent(currentUser.getId(), currentUser.getEmail(), "LOGOUT", "AUTH",
                    currentUser.getId().toString(), null, null, "SUCCESS", "User logged out successfully", clientIp);
        }
    }

    @Transactional
    public UserResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateResourceException("User already exists with email: " + email);
        }

        RoleName targetRole = request.getRole() != null ? request.getRole() : RoleName.SALES_EXECUTIVE;
        Role role = roleRepository.findByName(targetRole)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + targetRole));

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User(request.getName().trim(), email, encodedPassword, role, request.getDepartment());
        User savedUser = userRepository.save(user);

        String clientIp = getClientIp(httpRequest);
        auditService.logEvent(savedUser.getId(), savedUser.getEmail(), "USER_REGISTER", "USER",
                savedUser.getId().toString(), null, savedUser.getName(), "SUCCESS",
                "New user registered with role " + targetRole, clientIp);

        return UserResponse.fromEntity(savedUser);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new InvalidOperationException("Current password does not match.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        refreshTokenRepository.revokeAllUserTokens(user);

        String clientIp = getClientIp(httpRequest);
        auditService.logEvent(user.getId(), user.getEmail(), "CHANGE_PASSWORD", "USER",
                user.getId().toString(), null, null, "SUCCESS", "User changed password", clientIp);
    }

    @Transactional
    public void resetPassword(Long userId, ResetPasswordRequest request, UserPrincipal admin, HttpServletRequest httpRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.resetFailedLogins();
        userRepository.save(user);
        refreshTokenRepository.revokeAllUserTokens(user);

        String clientIp = getClientIp(httpRequest);
        auditService.logEvent(admin.getId(), admin.getEmail(), "RESET_PASSWORD_ADMIN", "USER",
                user.getId().toString(), null, null, "SUCCESS", "Admin reset password for user: " + user.getEmail(), clientIp);
    }

    private String createRefreshToken(User user) {
        String tokenStr = UUID.randomUUID().toString();
        String family = UUID.randomUUID().toString();
        Instant expiry = Instant.now().plusMillis(refreshExpirationMs);

        RefreshToken token = new RefreshToken(user, tokenStr, family, expiry);
        refreshTokenRepository.save(token);
        return tokenStr;
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return "0.0.0.0";
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}

