package com.acxiom.crm.dto;

import com.acxiom.crm.entity.Lead;
import com.acxiom.crm.entity.LeadSource;
import com.acxiom.crm.entity.LeadStatus;
import com.acxiom.crm.entity.Priority;

import java.math.BigDecimal;
import java.time.Instant;

public class LeadResponse {
    private Long id;
    private String leadCode;
    private String leadName;
    private String email;
    private String phone;
    private String companyName;
    private LeadSource source;
    private LeadStatus status;
    private BigDecimal expectedValue;
    private Priority priority;
    private Long assignedToUserId;
    private String assignedToUserName;
    private Long convertedCustomerId;
    private String convertedCustomerName;
    private Long convertedOpportunityId;
    private Instant convertedAt;
    private String notes;
    private Long createdByUserId;
    private String createdByUserName;
    private Instant createdAt;
    private Instant updatedAt;

    public LeadResponse() {}

    public static LeadResponse fromEntity(Lead lead) {
        LeadResponse dto = new LeadResponse();
        dto.setId(lead.getId());
        dto.setLeadCode(lead.getLeadCode());
        dto.setLeadName(lead.getLeadName());
        dto.setEmail(lead.getEmail());
        dto.setPhone(lead.getPhone());
        dto.setCompanyName(lead.getCompanyName());
        dto.setSource(lead.getSource());
        dto.setStatus(lead.getStatus());
        dto.setExpectedValue(lead.getExpectedValue());
        dto.setPriority(lead.getPriority());
        if (lead.getAssignedTo() != null) {
            dto.setAssignedToUserId(lead.getAssignedTo().getId());
            dto.setAssignedToUserName(lead.getAssignedTo().getName());
        }
        if (lead.getConvertedCustomer() != null) {
            dto.setConvertedCustomerId(lead.getConvertedCustomer().getId());
            dto.setConvertedCustomerName(lead.getConvertedCustomer().getCustomerName());
        }
        dto.setConvertedOpportunityId(lead.getConvertedOpportunityId());
        dto.setConvertedAt(lead.getConvertedAt());
        dto.setNotes(lead.getNotes());
        if (lead.getCreatedBy() != null) {
            dto.setCreatedByUserId(lead.getCreatedBy().getId());
            dto.setCreatedByUserName(lead.getCreatedBy().getName());
        }
        dto.setCreatedAt(lead.getCreatedAt());
        dto.setUpdatedAt(lead.getUpdatedAt());
        return dto;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLeadCode() {
        return leadCode;
    }

    public void setLeadCode(String leadCode) {
        this.leadCode = leadCode;
    }

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

    public String getAssignedToUserName() {
        return assignedToUserName;
    }

    public void setAssignedToUserName(String assignedToUserName) {
        this.assignedToUserName = assignedToUserName;
    }

    public Long getConvertedCustomerId() {
        return convertedCustomerId;
    }

    public void setConvertedCustomerId(Long convertedCustomerId) {
        this.convertedCustomerId = convertedCustomerId;
    }

    public String getConvertedCustomerName() {
        return convertedCustomerName;
    }

    public void setConvertedCustomerName(String convertedCustomerName) {
        this.convertedCustomerName = convertedCustomerName;
    }

    public Long getConvertedOpportunityId() {
        return convertedOpportunityId;
    }

    public void setConvertedOpportunityId(Long convertedOpportunityId) {
        this.convertedOpportunityId = convertedOpportunityId;
    }

    public Instant getConvertedAt() {
        return convertedAt;
    }

    public void setConvertedAt(Instant convertedAt) {
        this.convertedAt = convertedAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public String getCreatedByUserName() {
        return createdByUserName;
    }

    public void setCreatedByUserName(String createdByUserName) {
        this.createdByUserName = createdByUserName;
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

