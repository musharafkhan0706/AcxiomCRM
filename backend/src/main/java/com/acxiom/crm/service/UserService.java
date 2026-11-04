package com.acxiom.crm.service;

import com.acxiom.crm.audit.AuditService;
import com.acxiom.crm.dto.PagedResponse;
import com.acxiom.crm.dto.UpdateUserRoleRequest;
import com.acxiom.crm.dto.UserRequest;
import com.acxiom.crm.dto.UserResponse;
import com.acxiom.crm.entity.Role;
import com.acxiom.crm.entity.RoleName;
import com.acxiom.crm.entity.User;
import com.acxiom.crm.exception.DuplicateResourceException;
import com.acxiom.crm.exception.InvalidOperationException;
import com.acxiom.crm.exception.ResourceNotFoundException;
import com.acxiom.crm.repository.RefreshTokenRepository;
import com.acxiom.crm.repository.RoleRepository;
import com.acxiom.crm.repository.UserRepository;
import com.acxiom.crm.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<UserResponse> searchUsers(String query, RoleName role, Boolean isActive, Pageable pageable) {
        Page<User> page = userRepository.searchUsers(query, role, isActive, pageable);
        return PagedResponse.from(page.map(UserResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return UserResponse.fromEntity(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAssignableUsers() {
        return userRepository.findAll().stream()
                .filter(User::isActive)
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse createUser(UserRequest request, UserPrincipal admin) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateResourceException("User already exists with email: " + email);
        }

        Role role = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + request.getRole()));

        String rawPassword = request.getPassword() != null && !request.getPassword().isBlank()
                ? request.getPassword() : "Acxiom@2026!";
        String encodedPassword = passwordEncoder.encode(rawPassword);

        User user = new User(request.getName().trim(), email, encodedPassword, role, request.getDepartment());
        user.setActive(request.isActive());
        User saved = userRepository.save(user);

        auditService.logEvent(admin.getId(), admin.getEmail(), "USER_CREATE", "USER",
                saved.getId().toString(), null, saved.getEmail(), "SUCCESS",
                "Created user " + saved.getEmail() + " with role " + role.getName(), null);

        return UserResponse.fromEntity(saved);
    }

    @Transactional
    public UserResponse updateUser(Long id, UserRequest request, UserPrincipal admin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        String oldEmail = user.getEmail();
        String newEmail = request.getEmail().trim().toLowerCase();

        if (!oldEmail.equalsIgnoreCase(newEmail) && userRepository.existsByEmailIgnoreCase(newEmail)) {
            throw new DuplicateResourceException("Email already in use by another user: " + newEmail);
        }

        Role role = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + request.getRole()));

        String oldData = user.getName() + " (" + user.getRole().getName() + ")";

        user.setName(request.getName().trim());
        user.setEmail(newEmail);
        user.setRole(role);
        user.setDepartment(request.getDepartment());
        user.setActive(request.isActive());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            refreshTokenRepository.revokeAllUserTokens(user);
        }

        User updated = userRepository.save(user);

        auditService.logEvent(admin.getId(), admin.getEmail(), "USER_UPDATE", "USER",
                updated.getId().toString(), oldData, updated.getName() + " (" + role.getName() + ")", "SUCCESS",
                "Updated user " + updated.getEmail(), null);

        return UserResponse.fromEntity(updated);
    }

    @Transactional
    public UserResponse updateUserRole(Long id, UpdateUserRoleRequest request, UserPrincipal admin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Prevent admin from demoting themselves and locking themselves out
        if (user.getId().equals(admin.getId()) && request.getRole() != RoleName.ADMIN) {
            throw new InvalidOperationException("Administrators cannot demote their own account role.");
        }

        Role role = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + request.getRole()));

        String oldRole = user.getRole().getName().name();
        user.setRole(role);
        User updated = userRepository.save(user);

        auditService.logEvent(admin.getId(), admin.getEmail(), "ROLE_CHANGE", "USER",
                updated.getId().toString(), oldRole, role.getName().name(), "SUCCESS",
                "Changed role of user " + user.getEmail() + " to " + role.getName(), null);

        return UserResponse.fromEntity(updated);
    }

    @Transactional
    public UserResponse toggleUserActive(Long id, UserPrincipal admin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (user.getId().equals(admin.getId())) {
            throw new InvalidOperationException("You cannot deactivate your own administrative account.");
        }

        boolean newStatus = !user.isActive();
        user.setActive(newStatus);
        if (!newStatus) {
            refreshTokenRepository.revokeAllUserTokens(user);
        }
        User updated = userRepository.save(user);

        auditService.logEvent(admin.getId(), admin.getEmail(), newStatus ? "USER_ACTIVATE" : "USER_DEACTIVATE",
                "USER", updated.getId().toString(), String.valueOf(!newStatus), String.valueOf(newStatus),
                "SUCCESS", (newStatus ? "Activated" : "Deactivated") + " user " + user.getEmail(), null);

        return UserResponse.fromEntity(updated);
    }

    @Transactional
    public UserResponse setUserActive(Long id, boolean active, UserPrincipal admin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (user.getId().equals(admin.getId()) && !active) {
            throw new InvalidOperationException("You cannot deactivate your own administrative account.");
        }

        user.setActive(active);
        if (!active) {
            refreshTokenRepository.revokeAllUserTokens(user);
        }
        User updated = userRepository.save(user);

        auditService.logEvent(admin.getId(), admin.getEmail(), active ? "USER_ACTIVATE" : "USER_DEACTIVATE",
                "USER", updated.getId().toString(), String.valueOf(!active), String.valueOf(active),
                "SUCCESS", (active ? "Activated" : "Deactivated") + " user " + user.getEmail(), null);

        return UserResponse.fromEntity(updated);
    }

    @Transactional
    public UserResponse unlockUser(Long id, UserPrincipal admin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.unlockAccount();
        User updated = userRepository.save(user);

        auditService.logEvent(admin.getId(), admin.getEmail(), "USER_UNLOCK", "USER",
                updated.getId().toString(), "LOCKED", "UNLOCKED", "SUCCESS",
                "Administrator manually unlocked account for user: " + user.getEmail(), null);

        return UserResponse.fromEntity(updated);
    }
}

