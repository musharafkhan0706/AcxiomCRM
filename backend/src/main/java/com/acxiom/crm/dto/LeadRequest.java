package com.acxiom.crm.dto;

import com.acxiom.crm.entity.LeadSource;
import com.acxiom.crm.entity.LeadStatus;
import com.acxiom.crm.entity.Priority;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public class LeadRequest {

    @NotBlank(message = "Lead Name is required.")
    @Size(max = 150, message = "Lead Name cannot exceed 150 characters.")
    private String leadName;

    @NotBlank(message = "Email is required.")
    @Email(message = "Enter a valid email address.")
    @Size(max = 150, message = "Email cannot exceed 150 characters.")
    private String email;

    @NotBlank(message = "Phone number is required.")
    @Pattern(regexp = "^[+0-9\\s\\-\\(\\)]{7,25}$", message = "Enter a valid phone number.")
    private String phone;

    @Size(max = 150, message = "Company Name cannot exceed 150 characters.")
    private String companyName;

    @NotNull(message = "Lead Source is required.")
    private LeadSource source;

    private LeadStatus status = LeadStatus.NEW;

    @DecimalMin(value = "0.0", inclusive = true, message = "Expected value cannot be negative.")
    private BigDecimal expectedValue = BigDecimal.ZERO;

    private Priority priority = Priority.MEDIUM;

    private Long assignedToUserId;

    private String notes;

    public LeadRequest() {}

    public String getLeadName() {
        return leadName;
    }

    public void setLeadName(String leadName) {
        this.leadName = leadName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public LeadSource getSource() {
        return source;
    }

    public void setSource(LeadSource source) {
        this.source = source;
    }

    public LeadStatus getStatus() {
        return status;
    }

    public void setStatus(LeadStatus status) {
        this.status = status;
    }

    public BigDecimal getExpectedValue() {
        return expectedValue;
    }

    public void setExpectedValue(BigDecimal expectedValue) {
        this.expectedValue = expectedValue;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public Long getAssignedToUserId() {
        return assignedToUserId;
    }

    public void setAssignedToUserId(Long assignedToUserId) {
        this.assignedToUserId = assignedToUserId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}

