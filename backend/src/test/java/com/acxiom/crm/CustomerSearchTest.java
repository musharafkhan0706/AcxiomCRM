package com.acxiom.crm;

import com.acxiom.crm.controller.CustomerController;
import com.acxiom.crm.dto.ApiResponse;
import com.acxiom.crm.dto.CustomerResponse;
import com.acxiom.crm.dto.PagedResponse;
import com.acxiom.crm.entity.Customer;
import com.acxiom.crm.entity.CustomerStatus;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerSearchTest {

        @Mock
        private CustomerRepository customerRepository;

        @Mock
        private SecurityScopeHelper scopeHelper;

        @InjectMocks
        private CustomerService customerService;

        private Customer testCustomer;

        @BeforeEach
        void setUp() {
                testCustomer = new Customer(
                                "CUST-1001",
                                "Apex Global Technologies",
                                "contact@apextech.io",
                                "+1-415-555-0199",
                                "Apex Global Inc.",
                                "100 Market St",
                                "San Francisco",
                                "CA",
                                CustomerStatus.ACTIVE,
                                null,
                                null);
        }

        @Test
        @DisplayName("searchCustomers should clean and trim search query")
        void testSearchCustomersTrimsWhitespace() {
                Page<Customer> page = new PageImpl<>(List.of(testCustomer), PageRequest.of(0, 10), 1);
                when(customerRepository.searchCustomers(eq("Apex"), eq(CustomerStatus.ACTIVE), any(),
                                any(Pageable.class)))
                                .thenReturn(page);

                PagedResponse<CustomerResponse> response = customerService.searchCustomers(
                                "   Apex   ", CustomerStatus.ACTIVE, null, PageRequest.of(0, 10));

                assertNotNull(response);
                assertEquals(1, response.getTotalElements());
                assertEquals("Apex Global Technologies", response.getContent().get(0).getCustomerName());
                assertEquals("Apex Global Inc.", response.getContent().get(0).getCompanyName());
                assertEquals("CUST-1001", response.getContent().get(0).getCustomerCode());
                assertEquals("contact@apextech.io", response.getContent().get(0).getEmail());
                assertEquals("+1-415-555-0199", response.getContent().get(0).getPhone());

                // Verify trimmed query "Apex" was passed to repository
                verify(customerRepository, times(1))
                                .searchCustomers(eq("Apex"), eq(CustomerStatus.ACTIVE), any(), any(Pageable.class));
        }

        @Test
        @DisplayName("searchCustomers should treat blank or whitespace-only query as null")
        void testSearchCustomersBlankQueryPassedAsNull() {
                Page<Customer> page = new PageImpl<>(List.of(testCustomer), PageRequest.of(0, 10), 1);
                when(customerRepository.searchCustomers(isNull(), isNull(), any(), any(Pageable.class)))
                                .thenReturn(page);

                PagedResponse<CustomerResponse> response = customerService.searchCustomers(
                                "    ", null, null, PageRequest.of(0, 10));

                assertNotNull(response);
                assertEquals(1, response.getTotalElements());
                verify(customerRepository, times(1))
                                .searchCustomers(isNull(), isNull(), any(), any(Pageable.class));
        }

        @Test
        @DisplayName("CustomerController should accept both query and search parameter names")
        void testCustomerControllerAcceptsSearchAndQueryParams() {
                CustomerService mockService = mock(CustomerService.class);
                CustomerController controller = new CustomerController(mockService);

                PagedResponse<CustomerResponse> pagedResponse = new PagedResponse<>(
                                Collections.emptyList(), 0, 10, 0L, 0, true);
                when(mockService.searchCustomers(eq("Apex"), isNull(), any(), any(Pageable.class)))
                                .thenReturn(pagedResponse);

                // Call with search parameter
                ResponseEntity<ApiResponse<PagedResponse<CustomerResponse>>> resp1 = controller.getCustomers(null,
                                "Apex", null, null, PageRequest.of(0, 10));

                assertEquals(HttpStatus.OK, resp1.getStatusCode());
                verify(mockService, times(1)).searchCustomers(eq("Apex"), isNull(), any(), any(Pageable.class));

                // Call with query parameter
                ResponseEntity<ApiResponse<PagedResponse<CustomerResponse>>> resp2 = controller.getCustomers("Apex",
                                null, null, null, PageRequest.of(0, 10));

                assertEquals(HttpStatus.OK, resp2.getStatusCode());
                verify(mockService, times(2)).searchCustomers(eq("Apex"), isNull(), any(), any(Pageable.class));
        }

        @Test
        @DisplayName("searchCustomers should return empty page when no matches found")
        void testSearchCustomersNoMatches() {
                Page<Customer> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);
                when(customerRepository.searchCustomers(eq("UnknownCorp"), isNull(), any(), any(Pageable.class)))
                                .thenReturn(emptyPage);

                PagedResponse<CustomerResponse> response = customerService.searchCustomers(
                                "UnknownCorp", null, null, PageRequest.of(0, 10));

                assertNotNull(response);
                assertEquals(0, response.getTotalElements());
                assertTrue(response.getContent().isEmpty());
        }
}
