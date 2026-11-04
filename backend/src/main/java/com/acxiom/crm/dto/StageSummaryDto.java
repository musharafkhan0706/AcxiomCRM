package com.acxiom.crm.dto;

import com.acxiom.crm.entity.OpportunityStage;

import java.math.BigDecimal;

public class StageSummaryDto {
    private OpportunityStage stage;
    private long count;
    private BigDecimal totalAmount;

    public StageSummaryDto() {}

    public StageSummaryDto(OpportunityStage stage, long count, BigDecimal totalAmount) {
        this.stage = stage;
        this.count = count;
        this.totalAmount = totalAmount;
    }

    public OpportunityStage getStage() {
        return stage;
    }

    public void setStage(OpportunityStage stage) {
        this.stage = stage;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }
}

