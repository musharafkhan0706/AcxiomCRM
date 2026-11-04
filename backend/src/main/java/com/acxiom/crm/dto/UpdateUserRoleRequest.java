package com.acxiom.crm.dto;

import com.acxiom.crm.entity.RoleName;
import jakarta.validation.constraints.NotNull;

public class UpdateUserRoleRequest {
    @NotNull(message = "Role is required")
    private RoleName role;

    public UpdateUserRoleRequest() {}

    public UpdateUserRoleRequest(RoleName role) {
        this.role = role;
    }

    public RoleName getRole() {
        return role;
    }

    public void setRole(RoleName role) {
        this.role = role;
    }
}

