package com.acxiom.crm.service;

import com.acxiom.crm.audit.AuditService;
import com.acxiom.crm.dto.*;
import com.acxiom.crm.entity.*;
import com.acxiom.crm.exception.*;
import com.acxiom.crm.repository.*;
import com.acxiom.crm.security.SecurityScopeHelper;
import com.acxiom.crm.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final LeadRepository leadRepository;
    private final OpportunityRepository opportunityRepository;
    private final FollowUpRepository followUpRepository;
    private final ActivityRepository activityRepository;
    private final SecurityScopeHelper scopeHelper;
    private final AuditService auditService;

    public CustomerService(CustomerRepository customerRepository,
                           UserRepository userRepository,
                           LeadRepository leadRepository,
                           OpportunityRepository opportunityRepository,
                           FollowUpRepository followUpRepository,
                           ActivityRepository activityRepository,
                           SecurityScopeHelper scopeHelper,
                           AuditService auditService) {
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.leadRepository = leadRepository;
        this.opportunityRepository = opportunityRepository;
        this.followUpRepository = followUpRepository;
        this.activityRepository = activityRepository;
        this.scopeHelper = scopeHelper;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<CustomerResponse> searchCustomers(String query, CustomerStatus status,
                                                          UserPrincipal currentUser, Pageable pageable) {
        String cleanQuery = (query != null) ? query.trim() : null;
        if (cleanQuery != null && cleanQuery.isEmpty()) {
            cleanQuery = null;
        }
        Collection<Long> scopedUserIds = scopeHelper.getScopedUserIds(currentUser);
        Page<Customer> page = customerRepository.searchCustomers(cleanQuery, status, scopedUserIds, pageable);
        return PagedResponse.from(page.map(CustomerResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> getAllAccessibleCustomers(UserPrincipal currentUser) {
        Collection<Long> scopedUserIds = scopeHelper.getScopedUserIds(currentUser);
        List<Customer> customers = customerRepository.findAccessibleCustomersByStatus(scopedUserIds, CustomerStatus.ACTIVE);
        return customers.stream()
                .map(CustomerResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(Long id, UserPrincipal currentUser) {
        Customer customer = findAndAuthorizeCustomer(id, currentUser);
        return CustomerResponse.fromEntity(customer);
    }

    @Transactional(readOnly = true)
    public Customer360Response getCustomer360(Long id, UserPrincipal currentUser) {
        Customer customer = findAndAuthorizeCustomer(id, currentUser);

        List<LeadResponse> leads = leadRepository.findByConvertedCustomerId(id).stream()
                .map(LeadResponse::fromEntity)
                .collect(Collectors.toList());

        List<OpportunityResponse> opportunities = opportunityRepository.findByCustomerId(id).stream()
                .map(OpportunityResponse::fromEntity)
                .collect(Collectors.toList());

        List<FollowUpResponse> followUps = followUpRepository.findByCustomerId(id).stream()
                .map(FollowUpResponse::fromEntity)
                .collect(Collectors.toList());

        List<ActivityResponse> activities = activityRepository.findByCustomerIdOrderByActivityDateDesc(id).stream()
                .map(ActivityResponse::fromEntity)
                .collect(Collectors.toList());

        List<AuditLogResponse> history = auditService.getEntityHistory("CUSTOMER", id.toString());

        return new Customer360Response(
                CustomerResponse.fromEntity(customer),
                leads,
                opportunities,
                followUps,
                activities,
                history
        );
    }

    @Transactional
    public CustomerResponse createCustomer(CustomerRequest request, UserPrincipal currentUser) {
        String email = request.getEmail().trim().toLowerCase();
        String phone = request.getPhone().trim();

        if (customerRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateResourceException("Customer with email '" + email + "' already exists.");
        }
        if (customerRepository.existsByPhone(phone)) {
            throw new DuplicateResourceException("Customer with phone number '" + phone + "' already exists.");
        }

        User assignedUser = null;
        if (request.getAssignedToUserId() != null) {
            assignedUser = userRepository.findById(request.getAssignedToUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with id: " + request.getAssignedToUserId()));
        } else if (currentUser != null) {
            assignedUser = userRepository.findById(currentUser.getId()).orElse(null);
        }

        User createdByUser = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;
        String customerCode = generateCustomerCode();

        Customer customer = new Customer(
                customerCode,
                request.getCustomerName().trim(),
                email,
                phone,
                request.getCompanyName(),
                request.getAddress(),
                request.getCity(),
                request.getState(),
                request.getStatus(),
                assignedUser,
                createdByUser
        );

        Customer saved = customerRepository.save(customer);

        if (currentUser != null) {
            auditService.logEvent(currentUser.getId(), currentUser.getEmail(), "CUSTOMER_CREATE", "CUSTOMER",
                    saved.getId().toString(), null, saved.getCustomerCode() + ": " + saved.getCustomerName(),
                    "SUCCESS", "Customer created successfully", null);
        }

        return CustomerResponse.fromEntity(saved);
    }

    @Transactional
    public CustomerResponse updateCustomer(Long id, CustomerRequest request, UserPrincipal currentUser) {
        Customer customer = findAndAuthorizeCustomer(id, currentUser);

        String newEmail = request.getEmail().trim().toLowerCase();
        String newPhone = request.getPhone().trim();

        if (!customer.getEmail().equalsIgnoreCase(newEmail) && customerRepository.existsByEmailIgnoreCaseAndIdNot(newEmail, id)) {
            throw new DuplicateResourceException("Customer with email '" + newEmail + "' already exists.");
        }
        if (!customer.getPhone().equals(newPhone) && customerRepository.existsByPhoneAndIdNot(newPhone, id)) {
            throw new DuplicateResourceException("Customer with phone number '" + newPhone + "' already exists.");
        }

        String oldValue = customer.getCustomerName() + " | " + customer.getEmail() + " | " + customer.getStatus();

        customer.setCustomerName(request.getCustomerName().trim());
        customer.setEmail(newEmail);
        customer.setPhone(newPhone);
        customer.setCompanyName(request.getCompanyName());
        customer.setAddress(request.getAddress());
        customer.setCity(request.getCity());
        customer.setState(request.getState());
        if (request.getStatus() != null) {
            customer.setStatus(request.getStatus());
        }

        if (request.getAssignedToUserId() != null) {
            User assignedUser = userRepository.findById(request.getAssignedToUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with id: " + request.getAssignedToUserId()));
            customer.setAssignedTo(assignedUser);
        }

        Customer updated = customerRepository.save(customer);
        String newValue = updated.getCustomerName() + " | " + updated.getEmail() + " | " + updated.getStatus();

        auditService.logEvent(currentUser.getId(), currentUser.getEmail(), "CUSTOMER_UPDATE", "CUSTOMER",
                updated.getId().toString(), oldValue, newValue, "SUCCESS", "Customer details updated", null);

        return CustomerResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteCustomer(Long id, UserPrincipal currentUser) {
        Customer customer = findAndAuthorizeCustomer(id, currentUser);
        CustomerStatus oldStatus = customer.getStatus();
        customer.setStatus(CustomerStatus.INACTIVE);
        customerRepository.save(customer);

        auditService.logEvent(currentUser.getId(), currentUser.getEmail(), "CUSTOMER_DEACTIVATE", "CUSTOMER",
                customer.getId().toString(), oldStatus != null ? oldStatus.name() : "ACTIVE", "INACTIVE", "SUCCESS",
                "Customer deactivated: " + customer.getCustomerCode(), null);
    }

    @Transactional
    public CustomerResponse reactivateCustomer(Long id, UserPrincipal currentUser) {
        Customer customer = findAndAuthorizeCustomer(id, currentUser);
        CustomerStatus oldStatus = customer.getStatus();
        customer.setStatus(CustomerStatus.ACTIVE);
        Customer updated = customerRepository.save(customer);

        auditService.logEvent(currentUser.getId(), currentUser.getEmail(), "CUSTOMER_REACTIVATE", "CUSTOMER",
                updated.getId().toString(), oldStatus != null ? oldStatus.name() : "INACTIVE", "ACTIVE", "SUCCESS",
                "Customer reactivated: " + updated.getCustomerCode(), null);

        return CustomerResponse.fromEntity(updated);
    }

    private Customer findAndAuthorizeCustomer(Long id, UserPrincipal currentUser) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        Long assignedId = customer.getAssignedTo() != null ? customer.getAssignedTo().getId() : null;
        Long createdById = customer.getCreatedBy() != null ? customer.getCreatedBy().getId() : null;

        if (!scopeHelper.canAccessRecord(currentUser, assignedId, createdById)) {
            throw new AccessDeniedException("Access denied: You do not have permission to view or manage this customer.");
        }

        return customer;
    }

    private String generateCustomerCode() {
        return customerRepository.findTopByOrderByIdDesc()
                .map(c -> "CUST-" + (1000 + c.getId() + 1))
                .orElse("CUST-1001");
    }
}

