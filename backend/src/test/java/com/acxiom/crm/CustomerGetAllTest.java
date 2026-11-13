package com.acxiom.crm;

import com.acxiom.crm.controller.CustomerController;
import com.acxiom.crm.dto.ApiResponse;
import com.acxiom.crm.dto.CustomerResponse;
import com.acxiom.crm.entity.*;
import com.acxiom.crm.repository.CustomerRepository;
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

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerGetAllTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private SecurityScopeHelper scopeHelper;

    @InjectMocks
    private CustomerService customerService;

    private User admin;
    private User manager;
    private User salesRep1;
    private User salesRep2;

    private UserPrincipal adminPrincipal;
    private UserPrincipal managerPrincipal;
    private UserPrincipal salesRep1Principal;

    private Customer customer1;
    private Customer customer2;

    @BeforeEach
    void setUp() {
        Role adminRole = new Role(RoleName.ADMIN, "Administrator");
        Role managerRole = new Role(RoleName.MANAGER, "Sales Manager");
        Role salesRole = new Role(RoleName.SALES_EXECUTIVE, "Sales Executive");

        admin = new User("Alexander Wright", "admin@acxiomcrm.com", "hash", adminRole, "Executive");
        admin.setId(1L);

        manager = new User("Marcus Vance", "manager@acxiomcrm.com", "hash", managerRole, "Enterprise Sales");
        manager.setId(2L);

        salesRep1 = new User("Sarah Jenkins", "sales1@acxiomcrm.com", "hash", salesRole, "Enterprise Sales");
        salesRep1.setId(3L);

        salesRep2 = new User("David Chen", "sales2@acxiomcrm.com", "hash", salesRole, "Enterprise Sales");
        salesRep2.setId(4L);

        adminPrincipal = UserPrincipal.create(admin);
        managerPrincipal = UserPrincipal.create(manager);
        salesRep1Principal = UserPrincipal.create(salesRep1);

        customer1 = new Customer(
                "CUST-1001", "Apex Global Technologies", "contact@apextech.io", "+1-415-555-0199",
                "Apex Global Inc.", "100 Market St", "San Francisco", "CA",
                CustomerStatus.ACTIVE, salesRep1, admin
        );
        customer1.setId(101L);

        customer2 = new Customer(
                "CUST-1002", "Blue Horizon Financial", "info@bluehorizon.com", "+1-212-555-0144",
                "Blue Horizon Group", "250 Wall St", "New York", "NY",
                CustomerStatus.ACTIVE, salesRep2, admin
        );
        customer2.setId(102L);
    }

    @Test
    @DisplayName("Admin: Retrieves all active customers without scope restrictions")
    void testGetAllCustomers_Admin_RetrievesAllActiveCustomers() {
        when(scopeHelper.getScopedUserIds(adminPrincipal)).thenReturn(null);
        when(customerRepository.findAccessibleCustomersByStatus(isNull(), eq(CustomerStatus.ACTIVE)))
                .thenReturn(List.of(customer1, customer2));

        List<CustomerResponse> result = customerService.getAllAccessibleCustomers(adminPrincipal);

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("CUST-1001", result.get(0).getCustomerCode());
        assertEquals("CUST-1002", result.get(1).getCustomerCode());

        verify(customerRepository, times(1))
                .findAccessibleCustomersByStatus(isNull(), eq(CustomerStatus.ACTIVE));
    }

    @Test
    @DisplayName("Sales Executive: Restricted to personal scoped user IDs")
    void testGetAllCustomers_SalesExecutive_RestrictedToOwnScope() {
        Collection<Long> personalScope = Collections.singletonList(3L);
        when(scopeHelper.getScopedUserIds(salesRep1Principal)).thenReturn(personalScope);
        when(customerRepository.findAccessibleCustomersByStatus(eq(personalScope), eq(CustomerStatus.ACTIVE)))
                .thenReturn(List.of(customer1));

        List<CustomerResponse> result = customerService.getAllAccessibleCustomers(salesRep1Principal);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("CUST-1001", result.get(0).getCustomerCode());
        assertEquals("Sarah Jenkins", result.get(0).getAssignedToUserName());

        verify(customerRepository, times(1))
                .findAccessibleCustomersByStatus(eq(personalScope), eq(CustomerStatus.ACTIVE));
    }

    @Test
    @DisplayName("Manager: Scoped to team member user IDs")
    void testGetAllCustomers_Manager_ScopedToTeamUserIds() {
        Collection<Long> teamScope = Set.of(2L, 3L, 4L);
        when(scopeHelper.getScopedUserIds(managerPrincipal)).thenReturn(teamScope);
        when(customerRepository.findAccessibleCustomersByStatus(eq(teamScope), eq(CustomerStatus.ACTIVE)))
                .thenReturn(List.of(customer1, customer2));

        List<CustomerResponse> result = customerService.getAllAccessibleCustomers(managerPrincipal);

        assertNotNull(result);
        assertEquals(2, result.size());

        verify(customerRepository, times(1))
                .findAccessibleCustomersByStatus(eq(teamScope), eq(CustomerStatus.ACTIVE));
    }

    @Test
    @DisplayName("Excludes inactive customers: query always requests CustomerStatus.ACTIVE")
    void testGetAllCustomers_AlwaysRequestsActiveStatus() {
        when(scopeHelper.getScopedUserIds(adminPrincipal)).thenReturn(null);
        when(customerRepository.findAccessibleCustomersByStatus(isNull(), eq(CustomerStatus.ACTIVE)))
                .thenReturn(Collections.emptyList());

        List<CustomerResponse> result = customerService.getAllAccessibleCustomers(adminPrincipal);

        assertNotNull(result);
        assertTrue(result.isEmpty());

        // Verify that CustomerStatus.ACTIVE is strictly queried (never INACTIVE or null)
        verify(customerRepository, times(1))
                .findAccessibleCustomersByStatus(any(), eq(CustomerStatus.ACTIVE));
    }

    @Test
    @DisplayName("CustomerController: GET /api/customers/all returns 200 OK with ApiResponse<List<CustomerResponse>>")
    void testCustomerController_GetAllEndpoint_ReturnsProperApiResponse() {
        CustomerService mockService = mock(CustomerService.class);
        CustomerController controller = new CustomerController(mockService);

        CustomerResponse r1 = CustomerResponse.fromEntity(customer1);
        CustomerResponse r2 = CustomerResponse.fromEntity(customer2);
        when(mockService.getAllAccessibleCustomers(adminPrincipal)).thenReturn(List.of(r1, r2));

        ResponseEntity<ApiResponse<List<CustomerResponse>>> response = controller.getAllCustomers(adminPrincipal);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Operation successful", response.getBody().getMessage());
        assertEquals(2, response.getBody().getData().size());
        assertEquals("CUST-1001", response.getBody().getData().get(0).getCustomerCode());
        assertEquals("CUST-1002", response.getBody().getData().get(1).getCustomerCode());

        verify(mockService, times(1)).getAllAccessibleCustomers(adminPrincipal);
    }
}
