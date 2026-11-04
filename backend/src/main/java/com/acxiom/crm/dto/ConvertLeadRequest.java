package com.acxiom.crm.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ConvertLeadRequest {

    private boolean createOpportunity = true;

    @Size(max = 150, message = "Opportunity name cannot exceed 150 characters")
    private String opportunityName;

    @DecimalMin(value = "0.01", message = "Opportunity Amount must be greater than 0.")
    private BigDecimal opportunityAmount;

    private LocalDate expectedCloseDate;

    public ConvertLeadRequest() {}

    public boolean isCreateOpportunity() {
        return createOpportunity;
    }

    public void setCreateOpportunity(boolean createOpportunity) {
        this.createOpportunity = createOpportunity;
    }

    public String getOpportunityName() {
        return opportunityName;
    }

    public void setOpportunityName(String opportunityName) {
        this.opportunityName = opportunityName;
    }

    public BigDecimal getOpportunityAmount() {
        return opportunityAmount;
    }

    public void setOpportunityAmount(BigDecimal opportunityAmount) {
        this.opportunityAmount = opportunityAmount;
    }

    public LocalDate getExpectedCloseDate() {
        return expectedCloseDate;
    }

    public void setExpectedCloseDate(LocalDate expectedCloseDate) {
        this.expectedCloseDate = expectedCloseDate;
    }
}

