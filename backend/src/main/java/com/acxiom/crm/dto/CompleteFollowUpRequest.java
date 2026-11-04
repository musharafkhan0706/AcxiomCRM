package com.acxiom.crm.dto;

public class CompleteFollowUpRequest {
    private String outcomeNotes;

    public CompleteFollowUpRequest() {}

    public CompleteFollowUpRequest(String outcomeNotes) {
        this.outcomeNotes = outcomeNotes;
    }

    public String getOutcomeNotes() {
        return outcomeNotes;
    }

    public void setOutcomeNotes(String outcomeNotes) {
        this.outcomeNotes = outcomeNotes;
    }
}

