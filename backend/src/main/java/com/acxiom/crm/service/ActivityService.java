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
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final CustomerRepository customerRepository;
    private final LeadRepository leadRepository;
    private final OpportunityRepository opportunityRepository;
    private final UserRepository userRepository;
    private final SecurityScopeHelper scopeHelper;
    private final AuditService auditService;

    public ActivityService(ActivityRepository activityRepository,
                           CustomerRepository customerRepository,
                           LeadRepository leadRepository,
                           OpportunityRepository opportunityRepository,
                           UserRepository userRepository,
                           SecurityScopeHelper scopeHelper,
                           AuditService auditService) {
        this.activityRepository = activityRepository;
        this.customerRepository = customerRepository;
        this.leadRepository = leadRepository;
        this.opportunityRepository = opportunityRepository;
        this.userRepository = userRepository;
        this.scopeHelper = scopeHelper;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<ActivityResponse> searchActivities(String query, ActivityStatus status,
                                                           ActivityType type, Long customerId,
                                                           Long leadId, Long opportunityId,
                                                           Instant startDate, Instant endDate,
                                                           UserPrincipal currentUser, Pageable pageable) {
        Collection<Long> scopedUserIds = scopeHelper.getScopedUserIds(currentUser);
        Page<Activity> page = activityRepository.searchActivities(query, status, type, customerId, leadId, opportunityId,
                startDate, endDate, scopedUserIds, pageable);
        return PagedResponse.from(page.map(ActivityResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public ActivityResponse getActivityById(Long id, UserPrincipal currentUser) {
        Activity activity = findAndAuthorizeActivity(id, currentUser);
        return ActivityResponse.fromEntity(activity);
    }

    @Transactional
    public ActivityResponse createActivity(ActivityRequest request, UserPrincipal currentUser) {
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

        Activity activity = new Activity(
                request.getActivityType(),
                request.getSubject().trim(),
                request.getDescription(),
                request.getActivityDate(),
                customer,
                lead,
                opportunity,
                request.getStatus(),
                assignedUser,
                createdByUser
        );

        Activity saved = activityRepository.save(activity);

        if (currentUser != null) {
            auditService.logEvent(currentUser.getId(), currentUser.getEmail(), "ACTIVITY_CREATE", "ACTIVITY",
                    saved.getId().toString(), null, saved.getSubject(),
                    "SUCCESS", "Logged " + saved.getActivityType() + " activity", null);
        }

        return ActivityResponse.fromEntity(saved);
    }

    @Transactional
    public ActivityResponse updateActivity(Long id, ActivityRequest request, UserPrincipal currentUser) {
        Activity activity = findAndAuthorizeActivity(id, currentUser);

        String oldValue = activity.getSubject() + " | " + activity.getStatus();

        activity.setActivityType(request.getActivityType());
        activity.setSubject(request.getSubject().trim());
        activity.setDescription(request.getDescription());
        activity.setActivityDate(request.getActivityDate());
        if (request.getStatus() != null) {
            activity.setStatus(request.getStatus());
        }

        if (request.getAssignedToUserId() != null) {
            User assignedUser = userRepository.findById(request.getAssignedToUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with id: " + request.getAssignedToUserId()));
            activity.setAssignedTo(assignedUser);
        }

        Activity updated = activityRepository.save(activity);
        String newValue = updated.getSubject() + " | " + updated.getStatus();

        auditService.logEvent(currentUser.getId(), currentUser.getEmail(), "ACTIVITY_UPDATE", "ACTIVITY",
                updated.getId().toString(), oldValue, newValue, "SUCCESS", "Activity updated", null);

        return ActivityResponse.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> getRecentActivities(UserPrincipal currentUser, int limit) {
        Collection<Long> scopedUserIds = scopeHelper.getScopedUserIds(currentUser);
        Pageable pageable = PageRequest.of(0, limit);
        return activityRepository.findRecentActivities(scopedUserIds, pageable).stream()
                .map(ActivityResponse::fromEntity)
                .collect(Collectors.toList());
    }

    private Activity findAndAuthorizeActivity(Long id, UserPrincipal currentUser) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found with id: " + id));

        Long assignedId = activity.getAssignedTo() != null ? activity.getAssignedTo().getId() : null;
        Long createdById = activity.getCreatedBy() != null ? activity.getCreatedBy().getId() : null;

        if (!scopeHelper.canAccessRecord(currentUser, assignedId, createdById)) {
            throw new AccessDeniedException("Access denied: You do not have permission to view or manage this activity.");
        }

        return activity;
    }
}

