package com.acxiom.crm.service;

import com.acxiom.crm.audit.AuditService;
import com.acxiom.crm.dto.*;
import com.acxiom.crm.entity.*;
import com.acxiom.crm.exception.*;
import com.acxiom.crm.repository.*;
import com.acxiom.crm.security.SecurityScopeHelper;
import com.acxiom.crm.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FollowUpService {

    private final FollowUpRepository followUpRepository;
    private final CustomerRepository customerRepository;
    private final LeadRepository leadRepository;
    private final OpportunityRepository opportunityRepository;
    private final UserRepository userRepository;
    private final SecurityScopeHelper scopeHelper;
    private final AuditService auditService;

    public FollowUpService(FollowUpRepository followUpRepository,
                           CustomerRepository customerRepository,
                           LeadRepository leadRepository,
                           OpportunityRepository opportunityRepository,
                           UserRepository userRepository,
                           SecurityScopeHelper scopeHelper,
                           AuditService auditService) {
        this.followUpRepository = followUpRepository;
        this.customerRepository = customerRepository;
        this.leadRepository = leadRepository;
        this.opportunityRepository = opportunityRepository;
        this.userRepository = userRepository;
        this.scopeHelper = scopeHelper;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<FollowUpResponse> searchFollowUps(String query, FollowUpStatus status,
                                                          FollowUpType type, Long customerId,
                                                          Long leadId, Long opportunityId,
                                                          Instant startDate, Instant endDate,
                                                          UserPrincipal currentUser, Pageable pageable) {
        Collection<Long> scopedUserIds = scopeHelper.getScopedUserIds(currentUser);
        Page<FollowUp> page = followUpRepository.searchFollowUps(query, status, type, customerId, leadId, opportunityId,
                startDate, endDate, scopedUserIds, pageable);
        return PagedResponse.from(page.map(FollowUpResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public FollowUpResponse getFollowUpById(Long id, UserPrincipal currentUser) {
        FollowUp followUp = findAndAuthorizeFollowUp(id, currentUser);
        return FollowUpResponse.fromEntity(followUp);
    }

    @Transactional
    public FollowUpResponse createFollowUp(FollowUpRequest request, UserPrincipal currentUser) {
        validateFollowUpDate(request.getFollowUpDate());

        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId()).orElse(null);
        }

        Lead lead = null;
        if (request.getLeadId() != null) {
            lead = leadRepository.findById(request.getLeadId()).orElse(null);
        }

        Opportunity opportunity = null;
        if (request.getOpportunityId() != null) {
            opportunity = opportunityRepository.findById(request.getOpportunityId()).orElse(null);
        }

        User assignedUser = null;
        if (request.getAssignedToUserId() != null) {
            assignedUser = userRepository.findById(request.getAssignedToUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with id: " + request.getAssignedToUserId()));
        } else if (currentUser != null) {
            assignedUser = userRepository.findById(currentUser.getId()).orElse(null);
        }

        User createdByUser = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;

        FollowUp followUp = new FollowUp(
                request.getRelatedType(),
                customer,
                lead,
                opportunity,
                request.getFollowUpDate(),
                request.getSubject().trim(),
                request.getFollowUpType(),
                request.getStatus(),
                assignedUser,
                request.getNotes(),
                createdByUser
        );

        FollowUp saved = followUpRepository.save(followUp);

        if (currentUser != null) {
            auditService.logEvent(currentUser.getId(), currentUser.getEmail(), "FOLLOW_UP_CREATE", "FOLLOW_UP",
                    saved.getId().toString(), null, saved.getSubject(),
                    "SUCCESS", "Follow-up scheduled for " + saved.getFollowUpDate(), null);
        }

        return FollowUpResponse.fromEntity(saved);
    }

    @Transactional
    public FollowUpResponse updateFollowUp(Long id, FollowUpRequest request, UserPrincipal currentUser) {
        FollowUp followUp = findAndAuthorizeFollowUp(id, currentUser);

        String oldValue = followUp.getSubject() + " | " + followUp.getFollowUpDate() + " | " + followUp.getStatus();

        followUp.setRelatedType(request.getRelatedType());
        followUp.setSubject(request.getSubject().trim());
        followUp.setFollowUpDate(request.getFollowUpDate());
        followUp.setFollowUpType(request.getFollowUpType());
        if (request.getStatus() != null) {
            followUp.setStatus(request.getStatus());
        }
        followUp.setNotes(request.getNotes());

        if (request.getAssignedToUserId() != null) {
            User assignedUser = userRepository.findById(request.getAssignedToUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with id: " + request.getAssignedToUserId()));
            followUp.setAssignedTo(assignedUser);
        }

        FollowUp updated = followUpRepository.save(followUp);
        String newValue = updated.getSubject() + " | " + updated.getFollowUpDate() + " | " + updated.getStatus();

        auditService.logEvent(currentUser.getId(), currentUser.getEmail(), "FOLLOW_UP_UPDATE", "FOLLOW_UP",
                updated.getId().toString(), oldValue, newValue, "SUCCESS", "Follow-up updated", null);

        return FollowUpResponse.fromEntity(updated);
    }

    @Transactional
    public FollowUpResponse completeFollowUp(Long id, CompleteFollowUpRequest request, UserPrincipal currentUser) {
        FollowUp followUp = findAndAuthorizeFollowUp(id, currentUser);

        followUp.setStatus(FollowUpStatus.COMPLETED);
        if (request != null && request.getOutcomeNotes() != null && !request.getOutcomeNotes().isBlank()) {
            followUp.setNotes((followUp.getNotes() != null ? followUp.getNotes() + "\n" : "") +
                    "[Completed Outcome]: " + request.getOutcomeNotes());
        }

        FollowUp updated = followUpRepository.save(followUp);

        auditService.logEvent(currentUser.getId(), currentUser.getEmail(), "FOLLOW_UP_COMPLETE", "FOLLOW_UP",
                updated.getId().toString(), "PLANNED", "COMPLETED", "SUCCESS", "Follow-up marked completed", null);

        return FollowUpResponse.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public List<FollowUpResponse> getUpcomingFollowUps(UserPrincipal currentUser, int limit) {
        Collection<Long> scopedUserIds = scopeHelper.getScopedUserIds(currentUser);
        Pageable pageable = PageRequest.of(0, limit);
        return followUpRepository.findUpcoming(Instant.now(), scopedUserIds, pageable).stream()
                .map(FollowUpResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FollowUpResponse> getOverdueFollowUps(UserPrincipal currentUser, int limit) {
        Collection<Long> scopedUserIds = scopeHelper.getScopedUserIds(currentUser);
        Pageable pageable = PageRequest.of(0, limit);
        return followUpRepository.findOverdue(Instant.now(), scopedUserIds, pageable).stream()
                .map(FollowUpResponse::fromEntity)
                .collect(Collectors.toList());
    }

    private void validateFollowUpDate(Instant date) {
        if (date == null) {
            throw new InvalidOperationException("Follow-up date is required");
        }
        // Allow within 5 minutes tolerance for immediate clock differences
        if (date.isBefore(Instant.now().minus(5, ChronoUnit.MINUTES))) {
            throw new InvalidOperationException("Follow-up date cannot be earlier than today.");
        }
    }

    private FollowUp findAndAuthorizeFollowUp(Long id, UserPrincipal currentUser) {
        FollowUp followUp = followUpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Follow-up not found with id: " + id));

        Long assignedId = followUp.getAssignedTo() != null ? followUp.getAssignedTo().getId() : null;
        Long createdById = followUp.getCreatedBy() != null ? followUp.getCreatedBy().getId() : null;

        if (!scopeHelper.canAccessRecord(currentUser, assignedId, createdById)) {
            throw new AccessDeniedException("Access denied: You do not have permission to view or manage this follow-up.");
        }

        return followUp;
    }
}

