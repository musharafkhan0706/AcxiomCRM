package com.acxiom.crm.dto;

import java.math.BigDecimal;

public class MonthlySalesDto {
    private String month;
    private BigDecimal wonAmount;
    private long wonCount;

    public MonthlySalesDto() {}

    public MonthlySalesDto(String month, BigDecimal wonAmount, long wonCount) {
        this.month = month;
        this.wonAmount = wonAmount;
        this.wonCount = wonCount;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public BigDecimal getWonAmount() {
        return wonAmount;
    }

    public void setWonAmount(BigDecimal wonAmount) {
        this.wonAmount = wonAmount;
    }

    public long getWonCount() {
        return wonCount;
    }

    public void setWonCount(long wonCount) {
        this.wonCount = wonCount;
    }
}

