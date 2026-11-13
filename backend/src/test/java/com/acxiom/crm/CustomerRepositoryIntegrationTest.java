package com.acxiom.crm;

import com.acxiom.crm.entity.*;
import com.acxiom.crm.repository.CustomerRepository;
import com.acxiom.crm.repository.RoleRepository;
import com.acxiom.crm.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class CustomerRepositoryIntegrationTest {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    private User admin;
    private User manager;
    private User sales1;
    private User sales2;

    private Customer custActiveSales1;
    private Customer custActiveSales2;
    private Customer custActiveManager;
    private Customer custInactiveSales1;
    private Customer custNullAssigned;
    private Customer custNullBoth;

    @BeforeEach
    void setUp() {
        customerRepository.deleteAll();

        Role adminRole = roleRepository.findByName(RoleName.ADMIN).orElseThrow();
        Role managerRole = roleRepository.findByName(RoleName.MANAGER).orElseThrow();
        Role salesRole = roleRepository.findByName(RoleName.SALES_EXECUTIVE).orElseThrow();

        admin = userRepository.save(new User("Admin User", "admin.test@acxiomcrm.com", "pwd", adminRole, "Leadership"));
        manager = userRepository.save(new User("Manager User", "manager.test@acxiomcrm.com", "pwd", managerRole, "Sales"));
        sales1 = userRepository.save(new User("Sales One", "sales1.test@acxiomcrm.com", "pwd", salesRole, "Sales"));
        sales2 = userRepository.save(new User("Sales Two", "sales2.test@acxiomcrm.com", "pwd", salesRole, "Sales"));

        // 1. Active assigned to sales1, created by admin
        custActiveSales1 = customerRepository.save(new Customer(
                "CUST-T001", "Alpha Corp", "alpha@test.com", "+1-555-0001",
                "Alpha Industries", "123 Main St", "Dallas", "TX",
                CustomerStatus.ACTIVE, sales1, admin
        ));

        // 2. Active assigned to sales2, created by manager
        custActiveSales2 = customerRepository.save(new Customer(
                "CUST-T002", "Beta Ltd", "beta@test.com", "+1-555-0002",
                "Beta Solutions", "456 Oak St", "Austin", "TX",
                CustomerStatus.ACTIVE, sales2, manager
        ));

        // 3. Active assigned to manager, created by admin
        custActiveManager = customerRepository.save(new Customer(
                "CUST-T003", "Gamma LLC", "gamma@test.com", "+1-555-0003",
                "Gamma Group", "789 Pine St", "Houston", "TX",
                CustomerStatus.ACTIVE, manager, admin
        ));

        // 4. Inactive assigned to sales1, created by admin
        custInactiveSales1 = customerRepository.save(new Customer(
                "CUST-T004", "Delta Inc", "delta@test.com", "+1-555-0004",
                "Delta Corp", "321 Elm St", "San Antonio", "TX",
                CustomerStatus.INACTIVE, sales1, admin
        ));

        // 5. Active with null assignedTo, created by sales1
        custNullAssigned = customerRepository.save(new Customer(
                "CUST-T005", "Epsilon Co", "epsilon@test.com", "+1-555-0005",
                "Epsilon Tech", "654 Maple St", "Fort Worth", "TX",
                CustomerStatus.ACTIVE, null, sales1
        ));

        // 6. Active with null assignedTo AND null createdBy
        custNullBoth = customerRepository.save(new Customer(
                "CUST-T006", "Zeta Systems", "zeta@test.com", "+1-555-0006",
                "Zeta Global", "987 Cedar St", "El Paso", "TX",
                CustomerStatus.ACTIVE, null, null
        ));
    }

    @Test
    @DisplayName("Admin scope: scopedUserIds = null returns all active customers, excludes inactive")
    void testFindAccessibleCustomersByStatus_AdminScope_NullUserIds() {
        List<Customer> results = customerRepository.findAccessibleCustomersByStatus(null, CustomerStatus.ACTIVE);

        assertNotNull(results);
        assertEquals(5, results.size(), "Should return all 5 active customers");

        List<String> codes = results.stream().map(Customer::getCustomerCode).toList();
        assertTrue(codes.contains("CUST-T001"));
        assertTrue(codes.contains("CUST-T002"));
        assertTrue(codes.contains("CUST-T003"));
        assertTrue(codes.contains("CUST-T005"));
        assertTrue(codes.contains("CUST-T006"));

        // Inactive customer must NOT be present
        assertFalse(codes.contains("CUST-T004"), "Inactive customer CUST-T004 must be excluded");
    }

    @Test
    @DisplayName("Sales Executive scope: restricted to single user ID (assigned or created)")
    void testFindAccessibleCustomersByStatus_SalesExecutiveScope() {
        Collection<Long> sales1Scope = Collections.singletonList(sales1.getId());
        List<Customer> results = customerRepository.findAccessibleCustomersByStatus(sales1Scope, CustomerStatus.ACTIVE);

        assertNotNull(results);
        // CUST-T001 (assignedTo sales1) and CUST-T005 (createdBy sales1)
        assertEquals(2, results.size(), "Sales1 should see exactly 2 active customers (1 assigned, 1 created)");

        List<String> codes = results.stream().map(Customer::getCustomerCode).toList();
        assertTrue(codes.contains("CUST-T001"));
        assertTrue(codes.contains("CUST-T005"));
        assertFalse(codes.contains("CUST-T002"));
        assertFalse(codes.contains("CUST-T003"));
        assertFalse(codes.contains("CUST-T004"));
        assertFalse(codes.contains("CUST-T006"));
    }

    @Test
    @DisplayName("Manager scope: multiple user IDs in scope")
    void testFindAccessibleCustomersByStatus_ManagerScope() {
        // Manager manages manager and sales1, but NOT sales2
        Collection<Long> managerScope = List.of(manager.getId(), sales1.getId());
        List<Customer> results = customerRepository.findAccessibleCustomersByStatus(managerScope, CustomerStatus.ACTIVE);

        assertNotNull(results);
        // CUST-T001 (assigned to sales1)
        // CUST-T003 (assigned to manager)
        // CUST-T005 (created by sales1)
        // CUST-T002 is assigned to sales2, created by manager -> createdBy is in managerScope, so CUST-T002 is also visible!
        List<String> codes = results.stream().map(Customer::getCustomerCode).toList();
        assertTrue(codes.contains("CUST-T001"));
        assertTrue(codes.contains("CUST-T002"), "Manager created CUST-T002, so it should be visible");
        assertTrue(codes.contains("CUST-T003"));
        assertTrue(codes.contains("CUST-T005"));

        // Inactive customer must NOT be returned
        assertFalse(codes.contains("CUST-T004"));
        // CUST-T006 has null assigned and null created, not in managerScope
        assertFalse(codes.contains("CUST-T006"));
    }

    @Test
    @DisplayName("Inactive customer exclusion: requesting ACTIVE excludes INACTIVE even when assigned to user")
    void testFindAccessibleCustomersByStatus_ExcludesInactive() {
        Collection<Long> sales1Scope = Collections.singletonList(sales1.getId());
        List<Customer> activeResults = customerRepository.findAccessibleCustomersByStatus(sales1Scope, CustomerStatus.ACTIVE);

        boolean hasInactive = activeResults.stream().anyMatch(c -> c.getStatus() == CustomerStatus.INACTIVE);
        assertFalse(hasInactive, "Active query must not return inactive records");

        List<Customer> inactiveResults = customerRepository.findAccessibleCustomersByStatus(sales1Scope, CustomerStatus.INACTIVE);
        assertEquals(1, inactiveResults.size());
        assertEquals("CUST-T004", inactiveResults.get(0).getCustomerCode());
    }

    @Test
    @DisplayName("Safe handling of null assignedTo and null createdBy")
    void testFindAccessibleCustomersByStatus_HandlesNullRelationsSafely() {
        // Should execute without NullPointerException or SQL error
        assertDoesNotThrow(() -> {
            List<Customer> adminResults = customerRepository.findAccessibleCustomersByStatus(null, CustomerStatus.ACTIVE);
            assertTrue(adminResults.stream().anyMatch(c -> c.getAssignedTo() == null));
            assertTrue(adminResults.stream().anyMatch(c -> c.getCreatedBy() == null));
        });

        assertDoesNotThrow(() -> {
            Collection<Long> scope = List.of(99999L);
            List<Customer> emptyResults = customerRepository.findAccessibleCustomersByStatus(scope, CustomerStatus.ACTIVE);
            assertTrue(emptyResults.isEmpty());
        });
    }

    @Test
    @DisplayName("Results are sorted alphabetically by customerName")
    void testFindAccessibleCustomersByStatus_OrderedByName() {
        List<Customer> results = customerRepository.findAccessibleCustomersByStatus(null, CustomerStatus.ACTIVE);
        List<String> names = results.stream().map(Customer::getCustomerName).toList();

        List<String> sortedNames = new ArrayList<>(names);
        Collections.sort(sortedNames);

        assertEquals(sortedNames, names, "Results should be sorted alphabetically by customerName");
    }
}
