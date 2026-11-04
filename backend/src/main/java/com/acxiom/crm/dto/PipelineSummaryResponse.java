package com.acxiom.crm.dto;

import com.acxiom.crm.entity.OpportunityStage;

import java.math.BigDecimal;
import java.util.Map;

public class PipelineSummaryResponse {
    private BigDecimal totalAmount;
    private BigDecimal totalWeightedAmount;
    private long totalOpportunities;
    private long openOpportunities;
    private long wonOpportunities;
    private long lostOpportunities;
    private BigDecimal wonAmount;
    private BigDecimal lostAmount;
    private Map<OpportunityStage, StageSummaryDto> stages;

    public PipelineSummaryResponse() {}

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getTotalWeightedAmount() {
        return totalWeightedAmount;
    }

    public void setTotalWeightedAmount(BigDecimal totalWeightedAmount) {
        this.totalWeightedAmount = totalWeightedAmount;
    }

    public long getTotalOpportunities() {
        return totalOpportunities;
    }

    public void setTotalOpportunities(long totalOpportunities) {
        this.totalOpportunities = totalOpportunities;
    }

    public long getOpenOpportunities() {
        return openOpportunities;
    }

    public void setOpenOpportunities(long openOpportunities) {
        this.openOpportunities = openOpportunities;
    }

    public long getWonOpportunities() {
        return wonOpportunities;
    }

    public void setWonOpportunities(long wonOpportunities) {
        this.wonOpportunities = wonOpportunities;
    }

    public long getLostOpportunities() {
        return lostOpportunities;
    }

    public void setLostOpportunities(long lostOpportunities) {
        this.lostOpportunities = lostOpportunities;
    }

    public BigDecimal getWonAmount() {
        return wonAmount;
    }

    public void setWonAmount(BigDecimal wonAmount) {
        this.wonAmount = wonAmount;
    }

    public BigDecimal getLostAmount() {
        return lostAmount;
    }

    public void setLostAmount(BigDecimal lostAmount) {
        this.lostAmount = lostAmount;
    }

    public Map<OpportunityStage, StageSummaryDto> getStages() {
        return stages;
    }

    public void setStages(Map<OpportunityStage, StageSummaryDto> stages) {
        this.stages = stages;
    }
}

