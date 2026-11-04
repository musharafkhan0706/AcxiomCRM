package com.acxiom.crm;

import com.acxiom.crm.audit.AuditService;
import com.acxiom.crm.dto.OpportunityRequest;
import com.acxiom.crm.entity.Customer;
import com.acxiom.crm.entity.CustomerStatus;
import com.acxiom.crm.entity.Opportunity;
import com.acxiom.crm.entity.OpportunityStage;
import com.acxiom.crm.exception.InvalidOperationException;
import com.acxiom.crm.repository.CustomerRepository;
import com.acxiom.crm.repository.OpportunityRepository;
import com.acxiom.crm.security.SecurityScopeHelper;
import com.acxiom.crm.security.UserPrincipal;
import com.acxiom.crm.service.OpportunityService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class OpportunityServiceTest {

    @Mock
    private OpportunityRepository opportunityRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private SecurityScopeHelper scopeHelper;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private OpportunityService opportunityService;

    @Test
    @DisplayName("Should reject opportunity with non-positive amount")
    void testNegativeOrZeroAmountThrowsException() {
        OpportunityRequest request = new OpportunityRequest();
        request.setOpportunityName("Invalid Deal");
        request.setCustomerId(1L);
        request.setAmount(BigDecimal.ZERO);
        request.setProbability(50);
        request.setExpectedCloseDate(LocalDate.now().plusDays(10));

        InvalidOperationException ex = assertThrows(InvalidOperationException.class, () ->
                opportunityService.createOpportunity(request, null));

        assertEquals("Opportunity Amount must be greater than 0.", ex.getMessage());
    }

    @Test
    @DisplayName("Should reject opportunity with probability outside 0-100")
    void testInvalidProbabilityThrowsException() {
        OpportunityRequest request = new OpportunityRequest();
        request.setOpportunityName("Invalid Prob Deal");
        request.setCustomerId(1L);
        request.setAmount(BigDecimal.valueOf(10000));
        request.setProbability(120);
        request.setExpectedCloseDate(LocalDate.now().plusDays(10));

        InvalidOperationException ex = assertThrows(InvalidOperationException.class, () ->
                opportunityService.createOpportunity(request, null));

        assertEquals("Probability must be between 0 and 100.", ex.getMessage());
    }

    @Test
    @DisplayName("Should reject opportunity with close date in the past")
    void testPastCloseDateThrowsException() {
        OpportunityRequest request = new OpportunityRequest();
        request.setOpportunityName("Past Date Deal");
        request.setCustomerId(1L);
        request.setAmount(BigDecimal.valueOf(10000));
        request.setProbability(50);
        request.setExpectedCloseDate(LocalDate.now().minusDays(2));

        InvalidOperationException ex = assertThrows(InvalidOperationException.class, () ->
                opportunityService.createOpportunity(request, null));

        assertEquals("Expected Close Date cannot be in the past.", ex.getMessage());
    }

    @Test
    @DisplayName("Should correctly calculate weighted pipeline: Amount * Probability / 100")
    void testWeightedPipelineCalculation() {
        Customer c = new Customer("CUST-1", "Acme Corp", "a@acme.com", "+1-555-1111",
                "Acme", "123 Main St", "NY", "NY", CustomerStatus.ACTIVE, null, null);

        Opportunity opp = new Opportunity(
                "Acme Deal", c, null, BigDecimal.valueOf(50000.00),
                OpportunityStage.PROPOSAL, 40, LocalDate.now().plusDays(20),
                null, null, "Website", "Notes", null
        );

        BigDecimal weighted = opp.getWeightedPipeline();
        // 50,000 * 40 / 100 = 20,000.00
        assertEquals(0, BigDecimal.valueOf(20000.00).compareTo(weighted));
    }
}

