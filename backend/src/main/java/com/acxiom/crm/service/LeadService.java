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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;

@Service
public class LeadService {

    private final LeadRepository leadRepository;
    private final CustomerRepository customerRepository;
    private final OpportunityRepository opportunityRepository;
    private final UserRepository userRepository;
    private final SecurityScopeHelper scopeHelper;
    private final AuditService auditService;

    public LeadService(LeadRepository leadRepository,
                       CustomerRepository customerRepository,
                       OpportunityRepository opportunityRepository,
                       UserRepository userRepository,
                       SecurityScopeHelper scopeHelper,
                       AuditService auditService) {
        this.leadRepository = leadRepository;
        this.customerRepository = customerRepository;
        this.opportunityRepository = opportunityRepository;
        this.userRepository = userRepository;
        this.scopeHelper = scopeHelper;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<LeadResponse> searchLeads(String query, LeadStatus status, Priority priority,
                                                  LeadSource source, Long assignedUserId,
                                                  UserPrincipal currentUser, Pageable pageable) {
        Collection<Long> scopedUserIds = scopeHelper.getScopedUserIds(currentUser);
        Page<Lead> page = leadRepository.searchLeads(query, status, priority, source, assignedUserId, scopedUserIds, pageable);
        return PagedResponse.from(page.map(LeadResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public LeadResponse getLeadById(Long id, UserPrincipal currentUser) {
        Lead lead = findAndAuthorizeLead(id, currentUser);
        return LeadResponse.fromEntity(lead);
    }

    @Transactional
    public LeadResponse createLead(LeadRequest request, UserPrincipal currentUser) {
        User assignedUser = null;
        if (request.getAssignedToUserId() != null) {
            assignedUser = userRepository.findById(request.getAssignedToUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with id: " + request.getAssignedToUserId()));
        } else if (currentUser != null) {
            assignedUser = userRepository.findById(currentUser.getId()).orElse(null);
        }

        User createdByUser = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;
        String leadCode = generateLeadCode();

        Lead lead = new Lead(
                leadCode,
                request.getLeadName().trim(),
                request.getEmail().trim().toLowerCase(),
                request.getPhone().trim(),
                request.getCompanyName(),
                request.getSource(),
                request.getStatus(),
                request.getExpectedValue(),
                request.getPriority(),
                assignedUser,
                request.getNotes(),
                createdByUser
        );

        Lead saved = leadRepository.save(lead);

        if (currentUser != null) {
            auditService.logEvent(currentUser.getId(), currentUser.getEmail(), "LEAD_CREATE", "LEAD",
                    saved.getId().toString(), null, saved.getLeadCode() + ": " + saved.getLeadName(),
                    "SUCCESS", "Lead created successfully", null);
        }

        return LeadResponse.fromEntity(saved);
    }

    @Transactional
    public LeadResponse updateLead(Long id, LeadRequest request, UserPrincipal currentUser) {
        Lead lead = findAndAuthorizeLead(id, currentUser);

        if (lead.getStatus() == LeadStatus.CONVERTED && request.getStatus() != LeadStatus.CONVERTED) {
            throw new InvalidOperationException("Converted leads cannot change status.");
        }

        // Validate status transition
        validateStatusTransition(lead.getStatus(), request.getStatus());

        String oldValue = lead.getLeadName() + " | " + lead.getStatus() + " | " + lead.getPriority();

        lead.setLeadName(request.getLeadName().trim());
        lead.setEmail(request.getEmail().trim().toLowerCase());
        lead.setPhone(request.getPhone().trim());
        lead.setCompanyName(request.getCompanyName());
        lead.setSource(request.getSource());
        lead.setStatus(request.getStatus());
        lead.setExpectedValue(request.getExpectedValue());
        lead.setPriority(request.getPriority());
        lead.setNotes(request.getNotes());

        if (request.getAssignedToUserId() != null) {
            User assignedUser = userRepository.findById(request.getAssignedToUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with id: " + request.getAssignedToUserId()));
            lead.setAssignedTo(assignedUser);
        }

        Lead updated = leadRepository.save(lead);
        String newValue = updated.getLeadName() + " | " + updated.getStatus() + " | " + updated.getPriority();

        auditService.logEvent(currentUser.getId(), currentUser.getEmail(), "LEAD_UPDATE", "LEAD",
                updated.getId().toString(), oldValue, newValue, "SUCCESS", "Lead details updated", null);

        return LeadResponse.fromEntity(updated);
    }

    @Transactional
    public LeadResponse assignLead(Long id, AssignLeadRequest request, UserPrincipal currentUser) {
        Lead lead = findAndAuthorizeLead(id, currentUser);

        User newAssignee = userRepository.findById(request.getAssignedToUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getAssignedToUserId()));

        String oldAssigneeName = lead.getAssignedTo() != null ? lead.getAssignedTo().getName() : "Unassigned";
        lead.setAssignedTo(newAssignee);
        Lead updated = leadRepository.save(lead);

        auditService.logEvent(currentUser.getId(), currentUser.getEmail(), "LEAD_ASSIGN", "LEAD",
                updated.getId().toString(), oldAssigneeName, newAssignee.getName(), "SUCCESS",
                "Reassigned lead to " + newAssignee.getName(), null);

        return LeadResponse.fromEntity(updated);
    }

    @Transactional
    public ConvertLeadResponse convertLead(Long id, ConvertLeadRequest request, UserPrincipal currentUser) {
        Lead lead = findAndAuthorizeLead(id, currentUser);

        if (lead.getStatus() == LeadStatus.CONVERTED) {
            throw new InvalidOperationException("Lead is already converted.");
        }

        // Automatic qualification if converting
        lead.setStatus(LeadStatus.QUALIFIED);

        User currentActor = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;

        // 1. Create or link Customer
        Customer customer;
        String email = lead.getEmail().trim().toLowerCase();
        if (customerRepository.existsByEmailIgnoreCase(email)) {
            // Link existing customer
            customer = customerRepository.findAll().stream()
                    .filter(c -> c.getEmail().equalsIgnoreCase(email))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Customer lookup error"));
        } else {
            String customerCode = generateCustomerCode();
            customer = new Customer(
                    customerCode,
                    lead.getLeadName(),
                    email,
                    lead.getPhone(),
                    lead.getCompanyName(),
                    null,
                    null,
                    null,
                    CustomerStatus.ACTIVE,
                    lead.getAssignedTo(),
                    currentActor
            );
            customer = customerRepository.save(customer);

            auditService.logEvent(currentUser != null ? currentUser.getId() : null,
                    currentUser != null ? currentUser.getEmail() : "SYSTEM",
                    "CUSTOMER_CREATE_FROM_LEAD", "CUSTOMER",
                    customer.getId().toString(), null, customer.getCustomerCode(),
                    "SUCCESS", "Customer created automatically via lead conversion", null);
        }

        // 2. Optionally create Opportunity
        Opportunity opportunity = null;
        if (request.isCreateOpportunity()) {
            BigDecimal oppAmount = (request.getOpportunityAmount() != null && request.getOpportunityAmount().compareTo(BigDecimal.ZERO) > 0)
                    ? request.getOpportunityAmount()
                    : (lead.getExpectedValue() != null && lead.getExpectedValue().compareTo(BigDecimal.ZERO) > 0 ? lead.getExpectedValue() : BigDecimal.valueOf(5000.00));

            String oppName = (request.getOpportunityName() != null && !request.getOpportunityName().isBlank())
                    ? request.getOpportunityName()
                    : lead.getLeadName() + " - New Deal";

            LocalDate closeDate = request.getExpectedCloseDate() != null
                    ? request.getExpectedCloseDate()
                    : LocalDate.now().plusDays(30);

            opportunity = new Opportunity(
                    oppName,
                    customer,
                    lead,
                    oppAmount,
                    OpportunityStage.QUALIFICATION,
                    20,
                    closeDate,
                    OpportunityStatus.OPEN,
                    lead.getAssignedTo(),
                    lead.getSource().name(),
                    "Converted from Lead: " + lead.getLeadCode(),
                    currentActor
            );
            opportunity = opportunityRepository.save(opportunity);

            auditService.logEvent(currentUser != null ? currentUser.getId() : null,
                    currentUser != null ? currentUser.getEmail() : "SYSTEM",
                    "OPPORTUNITY_CREATE_FROM_LEAD", "OPPORTUNITY",
                    opportunity.getId().toString(), null, opportunity.getOpportunityName(),
                    "SUCCESS", "Opportunity created via lead conversion", null);
        }

        // 3. Mark Lead as CONVERTED
        lead.setStatus(LeadStatus.CONVERTED);
        lead.setConvertedCustomer(customer);
        if (opportunity != null) {
            lead.setConvertedOpportunityId(opportunity.getId());
        }
        lead.setConvertedAt(Instant.now());
        Lead savedLead = leadRepository.save(lead);

        auditService.logEvent(currentUser != null ? currentUser.getId() : null,
                currentUser != null ? currentUser.getEmail() : "SYSTEM",
                "LEAD_CONVERT", "LEAD",
                savedLead.getId().toString(), LeadStatus.QUALIFIED.name(), LeadStatus.CONVERTED.name(),
                "SUCCESS", "Lead converted into Customer " + customer.getCustomerCode() +
                           (opportunity != null ? " and Opportunity #" + opportunity.getId() : ""), null);

        return new ConvertLeadResponse(
                LeadResponse.fromEntity(savedLead),
                CustomerResponse.fromEntity(customer),
                opportunity != null ? OpportunityResponse.fromEntity(opportunity) : null
        );
    }

    @Transactional
    public void deleteLead(Long id, UserPrincipal currentUser) {
        Lead lead = findAndAuthorizeLead(id, currentUser);
        lead.setStatus(LeadStatus.LOST);
        leadRepository.save(lead);

        auditService.logEvent(currentUser.getId(), currentUser.getEmail(), "LEAD_ARCHIVE", "LEAD",
                lead.getId().toString(), null, "LOST", "SUCCESS", "Lead marked as LOST/Archived", null);
    }

    private void validateStatusTransition(LeadStatus currentStatus, LeadStatus targetStatus) {
        if (currentStatus == targetStatus) return;

        if (currentStatus == LeadStatus.CONVERTED) {
            throw new InvalidOperationException("Converted leads cannot change status.");
        }
    }

    private Lead findAndAuthorizeLead(Long id, UserPrincipal currentUser) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));

        Long assignedId = lead.getAssignedTo() != null ? lead.getAssignedTo().getId() : null;
        Long createdById = lead.getCreatedBy() != null ? lead.getCreatedBy().getId() : null;

        if (!scopeHelper.canAccessRecord(currentUser, assignedId, createdById)) {
            throw new AccessDeniedException("Access denied: You do not have permission to view or manage this lead.");
        }

        return lead;
    }

    private String generateLeadCode() {
        return leadRepository.findTopByOrderByIdDesc()
                .map(l -> "LEAD-" + (1000 + l.getId() + 1))
                .orElse("LEAD-1001");
    }

    private String generateCustomerCode() {
        return customerRepository.findTopByOrderByIdDesc()
                .map(c -> "CUST-" + (1000 + c.getId() + 1))
                .orElse("CUST-1001");
    }
}

