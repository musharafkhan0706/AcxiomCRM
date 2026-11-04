package com.acxiom.crm.dto;

import com.acxiom.crm.entity.OpportunityStage;
import jakarta.validation.constraints.NotNull;

public class UpdateStageRequest {

    @NotNull(message = "Stage is required")
    private OpportunityStage stage;

    private Integer probability;

    private String notes;

    public UpdateStageRequest() {}

    public UpdateStageRequest(OpportunityStage stage, Integer probability, String notes) {
        this.stage = stage;
        this.probability = probability;
        this.notes = notes;
    }

    public OpportunityStage getStage() {
        return stage;
    }

    public void setStage(OpportunityStage stage) {
        this.stage = stage;
    }

    public Integer getProbability() {
        return probability;
    }

    public void setProbability(Integer probability) {
        this.probability = probability;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}

