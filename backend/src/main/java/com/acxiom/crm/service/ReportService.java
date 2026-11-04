package com.acxiom.crm.service;

import com.acxiom.crm.dto.*;
import com.acxiom.crm.entity.*;
import com.acxiom.crm.repository.*;
import com.acxiom.crm.security.SecurityScopeHelper;
import com.acxiom.crm.security.UserPrincipal;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final CustomerRepository customerRepository;
    private final LeadRepository leadRepository;
    private final OpportunityRepository opportunityRepository;
    private final FollowUpRepository followUpRepository;
    private final AuditLogRepository auditLogRepository;
    private final SecurityScopeHelper scopeHelper;

    public ReportService(CustomerRepository customerRepository,
                         LeadRepository leadRepository,
                         OpportunityRepository opportunityRepository,
                         FollowUpRepository followUpRepository,
                         AuditLogRepository auditLogRepository,
                         SecurityScopeHelper scopeHelper) {
        this.customerRepository = customerRepository;
        this.leadRepository = leadRepository;
        this.opportunityRepository = opportunityRepository;
        this.followUpRepository = followUpRepository;
        this.auditLogRepository = auditLogRepository;
        this.scopeHelper = scopeHelper;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCustomerReport(UserPrincipal currentUser, Instant startDate, Instant endDate) {
        Collection<Long> scopedUserIds = scopeHelper.getScopedUserIds(currentUser);
        List<Customer> customers = customerRepository.findAll().stream()
                .filter(c -> {
                    if (scopedUserIds != null) {
                        Long assignedId = c.getAssignedTo() != null ? c.getAssignedTo().getId() : null;
                        Long createdById = c.getCreatedBy() != null ? c.getCreatedBy().getId() : null;
                        boolean inScope = (assignedId != null && scopedUserIds.contains(assignedId)) ||
                                         (createdById != null && scopedUserIds.contains(createdById));
                        if (!inScope) return false;
                    }
                    if (startDate != null && c.getCreatedAt().isBefore(startDate)) return false;
                    return endDate == null || !c.getCreatedAt().isAfter(endDate);
                })
                .collect(Collectors.toList());

        long activeCount = customers.stream().filter(c -> c.getStatus() == CustomerStatus.ACTIVE).count();
        long inactiveCount = customers.stream().filter(c -> c.getStatus() == CustomerStatus.INACTIVE).count();

        Map<String, Object> report = new HashMap<>();
        report.put("totalCustomers", customers.size());
        report.put("activeCustomers", activeCount);
        report.put("inactiveCustomers", inactiveCount);
        report.put("customers", customers.stream().map(CustomerResponse::fromEntity).collect(Collectors.toList()));
        return report;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getLeadReport(UserPrincipal currentUser, Instant startDate, Instant endDate) {
        Collection<Long> scopedUserIds = scopeHelper.getScopedUserIds(currentUser);
        List<Lead> leads = leadRepository.findAll().stream()
                .filter(l -> {
                    if (scopedUserIds != null) {
                        Long assignedId = l.getAssignedTo() != null ? l.getAssignedTo().getId() : null;
                        Long createdById = l.getCreatedBy() != null ? l.getCreatedBy().getId() : null;
                        boolean inScope = (assignedId != null && scopedUserIds.contains(assignedId)) ||
                                         (createdById != null && scopedUserIds.contains(createdById));
                        if (!inScope) return false;
                    }
                    if (startDate != null && l.getCreatedAt().isBefore(startDate)) return false;
                    return endDate == null || !l.getCreatedAt().isAfter(endDate);
                })
                .collect(Collectors.toList());

        Map<LeadStatus, Long> statusCounts = leads.stream()
                .collect(Collectors.groupingBy(Lead::getStatus, () -> new EnumMap<>(LeadStatus.class), Collectors.counting()));

        BigDecimal totalExpectedValue = leads.stream()
                .map(l -> l.getExpectedValue() != null ? l.getExpectedValue() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> report = new HashMap<>();
        report.put("totalLeads", leads.size());
        report.put("totalExpectedValue", totalExpectedValue);
        report.put("statusBreakdown", statusCounts);
        report.put("leads", leads.stream().map(LeadResponse::fromEntity).collect(Collectors.toList()));
        return report;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOpportunityReport(UserPrincipal currentUser, Instant startDate, Instant endDate) {
        Collection<Long> scopedUserIds = scopeHelper.getScopedUserIds(currentUser);
        List<Opportunity> opps = opportunityRepository.findAll().stream()
                .filter(o -> {
                    if (scopedUserIds != null) {
                        Long assignedId = o.getAssignedTo() != null ? o.getAssignedTo().getId() : null;
                        Long createdById = o.getCreatedBy() != null ? o.getCreatedBy().getId() : null;
                        boolean inScope = (assignedId != null && scopedUserIds.contains(assignedId)) ||
                                         (createdById != null && scopedUserIds.contains(createdById));
                        if (!inScope) return false;
                    }
                    if (startDate != null && o.getCreatedAt().isBefore(startDate)) return false;
                    return endDate == null || !o.getCreatedAt().isAfter(endDate);
                })
                .collect(Collectors.toList());

        BigDecimal totalAmount = opps.stream().map(o -> o.getAmount() != null ? o.getAmount() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalWeighted = opps.stream().map(Opportunity::getWeightedPipeline).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<OpportunityStage, Long> stageCounts = opps.stream()
                .collect(Collectors.groupingBy(Opportunity::getStage, () -> new EnumMap<>(OpportunityStage.class), Collectors.counting()));

        Map<String, Object> report = new HashMap<>();
        report.put("totalOpportunities", opps.size());
        report.put("totalAmount", totalAmount);
        report.put("weightedAmount", totalWeighted);
        report.put("stageBreakdown", stageCounts);
        report.put("opportunities", opps.stream().map(OpportunityResponse::fromEntity).collect(Collectors.toList()));
        return report;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getFollowUpReport(UserPrincipal currentUser, Instant startDate, Instant endDate) {
        Collection<Long> scopedUserIds = scopeHelper.getScopedUserIds(currentUser);
        List<FollowUp> followUps = followUpRepository.findAll().stream()
                .filter(f -> {
                    if (scopedUserIds != null) {
                        Long assignedId = f.getAssignedTo() != null ? f.getAssignedTo().getId() : null;
                        Long createdById = f.getCreatedBy() != null ? f.getCreatedBy().getId() : null;
                        boolean inScope = (assignedId != null && scopedUserIds.contains(assignedId)) ||
                                         (createdById != null && scopedUserIds.contains(createdById));
                        if (!inScope) return false;
                    }
                    if (startDate != null && f.getFollowUpDate().isBefore(startDate)) return false;
                    return endDate == null || !f.getFollowUpDate().isAfter(endDate);
                })
                .collect(Collectors.toList());

        long completed = followUps.stream().filter(f -> f.getStatus() == FollowUpStatus.COMPLETED).count();
        long planned = followUps.stream().filter(f -> f.getStatus() == FollowUpStatus.PLANNED).count();
        long missed = followUps.stream().filter(f -> f.getStatus() == FollowUpStatus.MISSED).count();

        Map<String, Object> report = new HashMap<>();
        report.put("totalFollowUps", followUps.size());
        report.put("completed", completed);
        report.put("planned", planned);
        report.put("missed", missed);
        report.put("followUps", followUps.stream().map(FollowUpResponse::fromEntity).collect(Collectors.toList()));
        return report;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getConversionReport(UserPrincipal currentUser, Instant startDate, Instant endDate) {
        Collection<Long> scopedUserIds = scopeHelper.getScopedUserIds(currentUser);
        List<Lead> leads = leadRepository.findAll().stream()
                .filter(l -> {
                    if (scopedUserIds != null) {
                        Long assignedId = l.getAssignedTo() != null ? l.getAssignedTo().getId() : null;
                        Long createdById = l.getCreatedBy() != null ? l.getCreatedBy().getId() : null;
                        boolean inScope = (assignedId != null && scopedUserIds.contains(assignedId)) ||
                                         (createdById != null && scopedUserIds.contains(createdById));
                        if (!inScope) return false;
                    }
                    if (startDate != null && l.getCreatedAt().isBefore(startDate)) return false;
                    return endDate == null || !l.getCreatedAt().isAfter(endDate);
                })
                .collect(Collectors.toList());

        long totalLeads = leads.size();
        long convertedLeads = leads.stream().filter(l -> l.getStatus() == LeadStatus.CONVERTED).count();
        double conversionRate = totalLeads > 0 ? ((double) convertedLeads / totalLeads) * 100.0 : 0.0;

        Map<String, Object> report = new HashMap<>();
        report.put("totalLeads", totalLeads);
        report.put("convertedLeads", convertedLeads);
        report.put("conversionRatePercentage", Math.round(conversionRate * 100.0) / 100.0);
        report.put("convertedLeadDetails", leads.stream().filter(l -> l.getStatus() == LeadStatus.CONVERTED).map(LeadResponse::fromEntity).collect(Collectors.toList()));
        return report;
    }

    @Transactional(readOnly = true)
    public PagedResponse<AuditLogResponse> getAuditReport(String query, String action, String entityName,
                                                          Long userId, Instant startDate, Instant endDate,
                                                          Pageable pageable) {
        return PagedResponse.from(auditLogRepository.searchLogs(query, action, entityName, userId, startDate, endDate, pageable)
                .map(AuditLogResponse::fromEntity));
    }
}
