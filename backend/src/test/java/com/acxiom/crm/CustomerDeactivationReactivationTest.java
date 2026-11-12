package com.acxiom.crm;

import com.acxiom.crm.audit.AuditService;
import com.acxiom.crm.controller.CustomerController;
import com.acxiom.crm.dto.ApiResponse;
import com.acxiom.crm.dto.Customer360Response;
import com.acxiom.crm.dto.CustomerResponse;
import com.acxiom.crm.entity.*;
import com.acxiom.crm.repository.*;
import com.acxiom.crm.security.SecurityScopeHelper;
import com.acxiom.crm.security.UserPrincipal;
import com.acxiom.crm.service.CustomerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerDeactivationReactivationTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LeadRepository leadRepository;

    @Mock
    private OpportunityRepository opportunityRepository;

    @Mock
    private FollowUpRepository followUpRepository;

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private SecurityScopeHelper scopeHelper;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private CustomerService customerService;

    private Customer activeCustomer;
    private Customer inactiveCustomer;
    private UserPrincipal adminUser;
    private UserPrincipal salesExecutiveUser;

    @BeforeEach
    void setUp() {
        Role adminRole = new Role(RoleName.ADMIN, "System Administrator");
        User admin = new User("Alexander Wright", "alexander.wright@acxiomcrm.internal",
                "hashed", adminRole, "Executive Leadership");
        admin.setId(1L);

        Role salesRole = new Role(RoleName.SALES_EXECUTIVE, "Sales Executive");
        User salesRep = new User("Elena Rostova", "elena.rostova@acxiomcrm.internal",
                "hashed", salesRole, "Enterprise Sales");
        salesRep.setId(3L);

        adminUser = UserPrincipal.create(admin);
        salesExecutiveUser = UserPrincipal.create(salesRep);

        activeCustomer = new Customer(
                "CUST-1001",
                "Apex Global Technologies",
                "contact@apextech.io",
                "+1-415-555-0199",
                "Apex Global Inc.",
                "100 Market St",
                "San Francisco",
                "CA",
                CustomerStatus.ACTIVE,
                salesRep,
                admin
        );
        activeCustomer.setId(1001L);

        inactiveCustomer = new Customer(
                "CUST-1002",
                "Blue Horizon Financial",
                "info@bluehorizon.com",
                "+1-212-555-0144",
                "Blue Horizon Group",
                "250 Wall St",
                "New York",
                "NY",
                CustomerStatus.INACTIVE,
                salesRep,
                admin
        );
        inactiveCustomer.setId(1002L);
    }

    @Test
    @DisplayName("Soft Deletion: deleteCustomer sets status to INACTIVE and preserves DB row without hard deletion")
    void testDeleteCustomerPerformsSoftDelete() {
        when(customerRepository.findById(1001L)).thenReturn(Optional.of(activeCustomer));
        when(scopeHelper.canAccessRecord(any(), any(), any())).thenReturn(true);
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        customerService.deleteCustomer(1001L, adminUser);

        // Verify status changed to INACTIVE
        assertEquals(CustomerStatus.INACTIVE, activeCustomer.getStatus());

        // Verify saved to database
        verify(customerRepository, times(1)).save(activeCustomer);

        // Verify hard delete was NEVER called
        verify(customerRepository, never()).delete(any());
        verify(customerRepository, never()).deleteById(any());

        // Verify audit log recorded deactivation with acting user and old/new values
        verify(auditService, times(1)).logEvent(
                eq(adminUser.getId()),
                eq(adminUser.getEmail()),
                eq("CUSTOMER_DEACTIVATE"),
                eq("CUSTOMER"),
                eq("1001"),
                eq("ACTIVE"),
                eq("INACTIVE"),
                eq("SUCCESS"),
                contains("CUST-1001"),
                isNull()
        );
    }

    @Test
    @DisplayName("Reactivation: reactivateCustomer sets status to ACTIVE, saves, and records audit trail")
    void testReactivateCustomerSuccess() {
        when(customerRepository.findById(1002L)).thenReturn(Optional.of(inactiveCustomer));
        when(scopeHelper.canAccessRecord(any(), any(), any())).thenReturn(true);
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerResponse response = customerService.reactivateCustomer(1002L, adminUser);

        // Verify status changed to ACTIVE
        assertNotNull(response);
        assertEquals(CustomerStatus.ACTIVE, inactiveCustomer.getStatus());
        assertEquals(CustomerStatus.ACTIVE, response.getStatus());

        // Verify saved to database
        verify(customerRepository, times(1)).save(inactiveCustomer);

        // Verify hard delete was NEVER called
        verify(customerRepository, never()).delete(any());

        // Verify audit log recorded reactivation
        verify(auditService, times(1)).logEvent(
                eq(adminUser.getId()),
                eq(adminUser.getEmail()),
                eq("CUSTOMER_REACTIVATE"),
                eq("CUSTOMER"),
                eq("1002"),
                eq("INACTIVE"),
                eq("ACTIVE"),
                eq("SUCCESS"),
                contains("CUST-1002"),
                isNull()
        );
    }

    @Test
    @DisplayName("Data Retention: getCustomer360 on inactive customer returns all historical leads, deals, tasks, and audit logs")
    void testInactiveCustomerRetainsAllRelatedHistory() {
        when(customerRepository.findById(1002L)).thenReturn(Optional.of(inactiveCustomer));
        when(scopeHelper.canAccessRecord(any(), any(), any())).thenReturn(true);

        Lead lead = new Lead();
        lead.setId(101L);
        lead.setLeadCode("LEAD-101");
        lead.setLeadName("Inquiry");
        lead.setEmail("inq@blue.com");
        lead.setPhone("+1-212-555-0144");
        lead.setStatus(LeadStatus.CONVERTED);
        lead.setConvertedCustomer(inactiveCustomer);
        when(leadRepository.findByConvertedCustomerId(1002L)).thenReturn(List.of(lead));

        Opportunity opp = new Opportunity();
        opp.setId(201L);
        opp.setOpportunityName("Enterprise License");
        opp.setCustomer(inactiveCustomer);
        opp.setAmount(BigDecimal.valueOf(120000));
        opp.setStage(OpportunityStage.WON);
        opp.setStatus(OpportunityStatus.WON);
        opp.setExpectedCloseDate(LocalDate.now());
        when(opportunityRepository.findByCustomerId(1002L)).thenReturn(List.of(opp));

        FollowUp fu = new FollowUp();
        fu.setId(301L);
        fu.setSubject("Quarterly review call");
        fu.setFollowUpType(FollowUpType.CALL);
        fu.setStatus(FollowUpStatus.PLANNED);
        fu.setFollowUpDate(Instant.now());
        fu.setRelatedType(RelatedType.CUSTOMER);
        fu.setCustomer(inactiveCustomer);
        when(followUpRepository.findByCustomerId(1002L)).thenReturn(List.of(fu));

        Activity act = new Activity();
        act.setId(401L);
        act.setSubject("Contract renewal meeting");
        act.setActivityType(ActivityType.MEETING);
        act.setStatus(ActivityStatus.COMPLETED);
        act.setActivityDate(Instant.now());
        act.setCustomer(inactiveCustomer);
        when(activityRepository.findByCustomerIdOrderByActivityDateDesc(1002L)).thenReturn(List.of(act));

        when(auditService.getEntityHistory("CUSTOMER", "1002")).thenReturn(Collections.emptyList());

        Customer360Response profile = customerService.getCustomer360(1002L, adminUser);

        assertNotNull(profile);
        assertEquals(CustomerStatus.INACTIVE, profile.getCustomer().getStatus());
        assertEquals("Blue Horizon Financial", profile.getCustomer().getCustomerName());
        assertEquals(1, profile.getLeads().size());
        assertEquals(1, profile.getOpportunities().size());
        assertEquals(1, profile.getFollowUps().size());
        assertEquals(1, profile.getActivities().size());
    }

    @Test
    @DisplayName("Scope Enforcement: unauthorized user out of team scope cannot deactivate customer")
    void testUnauthorizedUserCannotDeactivateCustomer() {
        when(customerRepository.findById(1001L)).thenReturn(Optional.of(activeCustomer));
        when(scopeHelper.canAccessRecord(eq(salesExecutiveUser), any(), any())).thenReturn(false);

        assertThrows(AccessDeniedException.class, () -> {
            customerService.deleteCustomer(1001L, salesExecutiveUser);
        });

        verify(customerRepository, never()).save(any());
        verify(auditService, never()).logEvent(any(), any(), eq("CUSTOMER_DEACTIVATE"), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Controller Security: deleteCustomer and reactivateCustomer endpoints enforce @PreAuthorize(\"hasAnyRole('ADMIN', 'MANAGER')\")")
    void testControllerMethodsHaveSecurityAnnotations() throws NoSuchMethodException {
        Method deleteMethod = CustomerController.class.getMethod("deleteCustomer", Long.class, UserPrincipal.class);
        PreAuthorize deletePreAuth = deleteMethod.getAnnotation(PreAuthorize.class);
        assertNotNull(deletePreAuth, "deleteCustomer must have @PreAuthorize annotation");
        assertTrue(deletePreAuth.value().contains("ADMIN") && deletePreAuth.value().contains("MANAGER"),
                "@PreAuthorize must allow ADMIN and MANAGER: " + deletePreAuth.value());

        Method reactivateMethod = CustomerController.class.getMethod("reactivateCustomer", Long.class, UserPrincipal.class);
        PreAuthorize reactivatePreAuth = reactivateMethod.getAnnotation(PreAuthorize.class);
        assertNotNull(reactivatePreAuth, "reactivateCustomer must have @PreAuthorize annotation");
        assertTrue(reactivatePreAuth.value().contains("ADMIN") && reactivatePreAuth.value().contains("MANAGER"),
                "@PreAuthorize must allow ADMIN and MANAGER: " + reactivatePreAuth.value());

        Method updateStatusMethod = CustomerController.class.getMethod("updateCustomerStatus", Long.class, CustomerStatus.class, UserPrincipal.class);
        PreAuthorize statusPreAuth = updateStatusMethod.getAnnotation(PreAuthorize.class);
        assertNotNull(statusPreAuth, "updateCustomerStatus must have @PreAuthorize annotation");
    }

    @Test
    @DisplayName("Controller Integration: reactivateCustomer delegates to CustomerService and returns 200 OK")
    void testCustomerControllerReactivateEndpoint() {
        CustomerService mockService = mock(CustomerService.class);
        CustomerController controller = new CustomerController(mockService);

        CustomerResponse mockResponse = CustomerResponse.fromEntity(activeCustomer);
        when(mockService.reactivateCustomer(1002L, adminUser)).thenReturn(mockResponse);

        ResponseEntity<ApiResponse<CustomerResponse>> response = controller.reactivateCustomer(1002L, adminUser);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Customer reactivated successfully", response.getBody().getMessage());
        verify(mockService, times(1)).reactivateCustomer(1002L, adminUser);
    }
}
