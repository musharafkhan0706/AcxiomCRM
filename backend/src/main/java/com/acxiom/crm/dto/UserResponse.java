package com.acxiom.crm.dto;

import com.acxiom.crm.entity.RoleName;
import com.acxiom.crm.entity.User;

import java.time.Instant;

public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private RoleName role;
    private String roleDescription;
    private String department;
    private boolean active;
    private int failedLoginCount;
    private boolean locked;
    private Instant lockoutTime;
    private Instant createdAt;
    private Instant updatedAt;

    public UserResponse() {}

    public static UserResponse fromEntity(User user) {
        UserResponse dto = new UserResponse();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        if (user.getRole() != null) {
            dto.setRole(user.getRole().getName());
            dto.setRoleDescription(user.getRole().getDescription());
        }
        dto.setDepartment(user.getDepartment());
        dto.setActive(user.isActive());
        dto.setFailedLoginCount(user.getFailedLoginCount());
        dto.setLocked(user.isLocked());
        dto.setLockoutTime(user.getLockoutTime());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public RoleName getRole() {
        return role;
    }

    public void setRole(RoleName role) {
        this.role = role;
    }

    public String getRoleDescription() {
        return roleDescription;
    }

    public void setRoleDescription(String roleDescription) {
        this.roleDescription = roleDescription;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public int getFailedLoginCount() {
        return failedLoginCount;
    }

    public void setFailedLoginCount(int failedLoginCount) {
        this.failedLoginCount = failedLoginCount;
    }

    public boolean isLocked() {
        return locked;
    }

    public void setLocked(boolean locked) {
        this.locked = locked;
    }

    public Instant getLockoutTime() {
        return lockoutTime;
    }

    public void setLockoutTime(Instant lockoutTime) {
        this.lockoutTime = lockoutTime;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

