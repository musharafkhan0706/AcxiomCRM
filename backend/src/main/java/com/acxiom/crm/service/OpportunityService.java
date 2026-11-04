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
import java.time.LocalDate;
import java.util.*;

@Service
public class OpportunityService {

    private final OpportunityRepository opportunityRepository;
    private final CustomerRepository customerRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final SecurityScopeHelper scopeHelper;
    private final AuditService auditService;

    public OpportunityService(OpportunityRepository opportunityRepository,
                              CustomerRepository customerRepository,
                              LeadRepository leadRepository,
                              UserRepository userRepository,
                              SecurityScopeHelper scopeHelper,
                              AuditService auditService) {
        this.opportunityRepository = opportunityRepository;
        this.customerRepository = customerRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.scopeHelper = scopeHelper;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<OpportunityResponse> searchOpportunities(String query, OpportunityStage stage,
                                                                 OpportunityStatus status, Long customerId,
                                                                 Long assignedUserId, UserPrincipal currentUser,
                                                                 Pageable pageable) {
        Collection<Long> scopedUserIds = scopeHelper.getScopedUserIds(currentUser);
        Page<Opportunity> page = opportunityRepository.searchOpportunities(query, stage, status, customerId, assignedUserId, scopedUserIds, pageable);
        return PagedResponse.from(page.map(OpportunityResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public OpportunityResponse getOpportunityById(Long id, UserPrincipal currentUser) {
        Opportunity opp = findAndAuthorizeOpportunity(id, currentUser);
        return OpportunityResponse.fromEntity(opp);
    }

    @Transactional
    public OpportunityResponse createOpportunity(OpportunityRequest request, UserPrincipal currentUser) {
        validateOpportunityBusinessRules(request.getAmount(), request.getProbability(), request.getExpectedCloseDate());

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));

        Lead lead = null;
        if (request.getLeadId() != null) {
            lead = leadRepository.findById(request.getLeadId()).orElse(null);
        }

        User assignedUser = null;
        if (request.getAssignedToUserId() != null) {
            assignedUser = userRepository.findById(request.getAssignedToUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with id: " + request.getAssignedToUserId()));
        } else if (currentUser != null) {
            assignedUser = userRepository.findById(currentUser.getId()).orElse(null);
        }

        User createdByUser = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;

        Opportunity opp = new Opportunity(
                request.getOpportunityName().trim(),
                customer,
                lead,
                request.getAmount(),
                request.getStage(),
                request.getProbability(),
                request.getExpectedCloseDate(),
                request.getStatus(),
                assignedUser,
                request.getSource(),
                request.getNotes(),
                createdByUser
        );

        Opportunity saved = opportunityRepository.save(opp);

        if (currentUser != null) {
            auditService.logEvent(currentUser.getId(), currentUser.getEmail(), "OPPORTUNITY_CREATE", "OPPORTUNITY",
                    saved.getId().toString(), null, saved.getOpportunityName() + " ($" + saved.getAmount() + ")",
                    "SUCCESS", "Opportunity created", null);
        }

        return OpportunityResponse.fromEntity(saved);
    }

    @Transactional
    public OpportunityResponse updateOpportunity(Long id, OpportunityRequest request, UserPrincipal currentUser) {
        Opportunity opp = findAndAuthorizeOpportunity(id, currentUser);

        validateOpportunityBusinessRules(request.getAmount(), request.getProbability(), request.getExpectedCloseDate());

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));

        Lead lead = null;
        if (request.getLeadId() != null) {
            lead = leadRepository.findById(request.getLeadId()).orElse(null);
        }

        String oldValue = opp.getOpportunityName() + " | " + opp.getStage() + " | $" + opp.getAmount();

        opp.setOpportunityName(request.getOpportunityName().trim());
        opp.setCustomer(customer);
        opp.setLead(lead);
        opp.setAmount(request.getAmount());
        opp.setStage(request.getStage());
        opp.setProbability(request.getProbability());
        opp.setExpectedCloseDate(request.getExpectedCloseDate());
        opp.setSource(request.getSource());
        opp.setNotes(request.getNotes());

        if (request.getAssignedToUserId() != null) {
            User assignedUser = userRepository.findById(request.getAssignedToUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with id: " + request.getAssignedToUserId()));
            opp.setAssignedTo(assignedUser);
        }

        Opportunity updated = opportunityRepository.save(opp);
        String newValue = updated.getOpportunityName() + " | " + updated.getStage() + " | $" + updated.getAmount();

        auditService.logEvent(currentUser.getId(), currentUser.getEmail(), "OPPORTUNITY_UPDATE", "OPPORTUNITY",
                updated.getId().toString(), oldValue, newValue, "SUCCESS", "Opportunity updated", null);

        return OpportunityResponse.fromEntity(updated);
    }

    @Transactional
    public OpportunityResponse updateStage(Long id, UpdateStageRequest request, UserPrincipal currentUser) {
        Opportunity opp = findAndAuthorizeOpportunity(id, currentUser);

        OpportunityStage oldStage = opp.getStage();
        OpportunityStage newStage = request.getStage();

        opp.setStage(newStage);

        if (request.getProbability() != null) {
            if (request.getProbability() < 0 || request.getProbability() > 100) {
                throw new InvalidOperationException("Probability must be between 0 and 100.");
            }
            opp.setProbability(request.getProbability());
        }

        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            opp.setNotes((opp.getNotes() != null ? opp.getNotes() + "\n" : "") + "[" + newStage + "] " + request.getNotes());
        }

        Opportunity updated = opportunityRepository.save(opp);

        auditService.logEvent(currentUser.getId(), currentUser.getEmail(), "STAGE_CHANGE", "OPPORTUNITY",
                updated.getId().toString(), oldStage.name(), newStage.name(), "SUCCESS",
                "Opportunity stage moved from " + oldStage + " to " + newStage, null);

        return OpportunityResponse.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public PipelineSummaryResponse getPipelineSummary(UserPrincipal currentUser) {
        Collection<Long> scopedUserIds = scopeHelper.getScopedUserIds(currentUser);
        List<Opportunity> allOpps = opportunityRepository.findAll();

        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalWeighted = BigDecimal.ZERO;
        long totalCount = 0;
        long openCount = 0;
        long wonCount = 0;
        long lostCount = 0;
        BigDecimal wonAmount = BigDecimal.ZERO;
        BigDecimal lostAmount = BigDecimal.ZERO;

        Map<OpportunityStage, StageSummaryDto> stageMap = new HashMap<>();
        for (OpportunityStage stage : OpportunityStage.values()) {
            stageMap.put(stage, new StageSummaryDto(stage, 0, BigDecimal.ZERO));
        }

        for (Opportunity opp : allOpps) {
            // Apply scoping
            if (scopedUserIds != null) {
                Long assignedId = opp.getAssignedTo() != null ? opp.getAssignedTo().getId() : null;
                Long createdById = opp.getCreatedBy() != null ? opp.getCreatedBy().getId() : null;
                boolean inScope = (assignedId != null && scopedUserIds.contains(assignedId)) ||
                                 (createdById != null && scopedUserIds.contains(createdById));
                if (!inScope) continue;
            }

            totalCount++;
            BigDecimal amt = opp.getAmount() != null ? opp.getAmount() : BigDecimal.ZERO;
            totalAmount = totalAmount.add(amt);
            totalWeighted = totalWeighted.add(opp.getWeightedPipeline());

            if (opp.getStage() == OpportunityStage.WON) {
                wonCount++;
                wonAmount = wonAmount.add(amt);
            } else if (opp.getStage() == OpportunityStage.LOST) {
                lostCount++;
                lostAmount = lostAmount.add(amt);
            } else {
                openCount++;
            }

            StageSummaryDto stageDto = stageMap.get(opp.getStage());
            stageDto.setCount(stageDto.getCount() + 1);
            stageDto.setTotalAmount(stageDto.getTotalAmount().add(amt));
        }

        PipelineSummaryResponse response = new PipelineSummaryResponse();
        response.setTotalAmount(totalAmount);
        response.setTotalWeightedAmount(totalWeighted);
        response.setTotalOpportunities(totalCount);
        response.setOpenOpportunities(openCount);
        response.setWonOpportunities(wonCount);
        response.setLostOpportunities(lostCount);
        response.setWonAmount(wonAmount);
        response.setLostAmount(lostAmount);
        response.setStages(stageMap);

        return response;
    }

    @Transactional
    public void deleteOpportunity(Long id, UserPrincipal currentUser) {
        Opportunity opp = findAndAuthorizeOpportunity(id, currentUser);
        opp.setStage(OpportunityStage.LOST);
        opportunityRepository.save(opp);

        auditService.logEvent(currentUser.getId(), currentUser.getEmail(), "OPPORTUNITY_ARCHIVE", "OPPORTUNITY",
                opp.getId().toString(), null, "LOST", "SUCCESS", "Opportunity marked as LOST", null);
    }

    private void validateOpportunityBusinessRules(BigDecimal amount, int probability, LocalDate expectedCloseDate) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidOperationException("Opportunity Amount must be greater than 0.");
        }
        if (probability < 0 || probability > 100) {
            throw new InvalidOperationException("Probability must be between 0 and 100.");
        }
        if (expectedCloseDate != null && expectedCloseDate.isBefore(LocalDate.now())) {
            throw new InvalidOperationException("Expected Close Date cannot be in the past.");
        }
    }

    private Opportunity findAndAuthorizeOpportunity(Long id, UserPrincipal currentUser) {
        Opportunity opp = opportunityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found with id: " + id));

        Long assignedId = opp.getAssignedTo() != null ? opp.getAssignedTo().getId() : null;
        Long createdById = opp.getCreatedBy() != null ? opp.getCreatedBy().getId() : null;

        if (!scopeHelper.canAccessRecord(currentUser, assignedId, createdById)) {
            throw new AccessDeniedException("Access denied: You do not have permission to view or manage this opportunity.");
        }

        return opp;
    }
}

