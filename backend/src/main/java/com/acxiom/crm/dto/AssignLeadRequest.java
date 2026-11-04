package com.acxiom.crm.dto;

import jakarta.validation.constraints.NotNull;

public class AssignLeadRequest {
    @NotNull(message = "Assigned user ID is required")
    private Long assignedToUserId;

    public AssignLeadRequest() {}

    public AssignLeadRequest(Long assignedToUserId) {
        this.assignedToUserId = assignedToUserId;
    }

    public Long getAssignedToUserId() {
        return assignedToUserId;
    }

    public void setAssignedToUserId(Long assignedToUserId) {
        this.assignedToUserId = assignedToUserId;
    }
}

