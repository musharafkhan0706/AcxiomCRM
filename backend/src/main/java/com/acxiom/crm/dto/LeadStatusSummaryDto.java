package com.acxiom.crm.dto;

import com.acxiom.crm.entity.LeadStatus;

public class LeadStatusSummaryDto {
    private LeadStatus status;
    private long count;

    public LeadStatusSummaryDto() {}

    public LeadStatusSummaryDto(LeadStatus status, long count) {
        this.status = status;
        this.count = count;
    }

    public LeadStatus getStatus() {
        return status;
    }

    public void setStatus(LeadStatus status) {
        this.status = status;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }
}

