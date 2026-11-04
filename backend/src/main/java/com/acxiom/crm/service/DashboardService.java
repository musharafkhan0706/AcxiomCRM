package com.acxiom.crm.service;

import com.acxiom.crm.dto.*;
import com.acxiom.crm.entity.*;
import com.acxiom.crm.repository.*;
import com.acxiom.crm.security.SecurityScopeHelper;
import com.acxiom.crm.security.UserPrincipal;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final CustomerRepository customerRepository;
    private final LeadRepository leadRepository;
    private final OpportunityRepository opportunityRepository;
    private final FollowUpRepository followUpRepository;
    private final ActivityRepository activityRepository;
    private final SecurityScopeHelper scopeHelper;

    public DashboardService(CustomerRepository customerRepository,
                            LeadRepository leadRepository,
                            OpportunityRepository opportunityRepository,
                            FollowUpRepository followUpRepository,
                            ActivityRepository activityRepository,
                            SecurityScopeHelper scopeHelper) {
        this.customerRepository = customerRepository;
        this.leadRepository = leadRepository;
        this.opportunityRepository = opportunityRepository;
        this.followUpRepository = followUpRepository;
        this.activityRepository = activityRepository;
        this.scopeHelper = scopeHelper;
    }

    @Transactional(readOnly = true)
    public DashboardMetricsResponse getDashboardMetrics(UserPrincipal currentUser,
                                                        String period,
                                                        Instant customStart,
                                                        Instant customEnd) {
        Collection<Long> scopedUserIds = scopeHelper.getScopedUserIds(currentUser);
        Instant[] dateRange = resolveDateRange(period, customStart, customEnd);
        Instant start = dateRange[0];
        Instant end = dateRange[1];

        DashboardMetricsResponse response = new DashboardMetricsResponse();

        // 1. KPI Counts
        long totalCustomers = customerRepository.countWithFilters(scopedUserIds, start, end);
        response.setTotalCustomers(totalCustomers);

        long totalLeads = leadRepository.countWithFilters(null, scopedUserIds, start, end);
        response.setTotalLeads(totalLeads);

        long convertedLeads = leadRepository.countWithFilters(LeadStatus.CONVERTED, scopedUserIds, start, end);
        long lostLeads = leadRepository.countWithFilters(LeadStatus.LOST, scopedUserIds, start, end);
        response.setOpenLeads(Math.max(0, totalLeads - convertedLeads - lostLeads));

        long totalOpportunities = opportunityRepository.countWithFilters(null, null, scopedUserIds, start, end);
        response.setTotalOpportunities(totalOpportunities);

        long openOpportunities = opportunityRepository.countWithFilters(OpportunityStatus.OPEN, null, scopedUserIds, start, end);
        response.setOpenOpportunities(openOpportunities);

        long wonOpportunities = opportunityRepository.countWithFilters(null, OpportunityStage.WON, scopedUserIds, start, end);
        response.setWonOpportunities(wonOpportunities);

        long lostOpportunities = opportunityRepository.countWithFilters(null, OpportunityStage.LOST, scopedUserIds, start, end);
        response.setLostOpportunities(lostOpportunities);

        // Sum amounts
        BigDecimal totalPipeline = BigDecimal.ZERO;
        BigDecimal weightedPipeline = BigDecimal.ZERO;

        List<Opportunity> oppList = opportunityRepository.findAll();
        for (Opportunity opp : oppList) {
            if (scopedUserIds != null) {
                Long assignedId = opp.getAssignedTo() != null ? opp.getAssignedTo().getId() : null;
                Long createdById = opp.getCreatedBy() != null ? opp.getCreatedBy().getId() : null;
                boolean inScope = (assignedId != null && scopedUserIds.contains(assignedId)) ||
                                 (createdById != null && scopedUserIds.contains(createdById));
                if (!inScope) continue;
            }
            if (start != null && opp.getCreatedAt().isBefore(start)) continue;
            if (end != null && opp.getCreatedAt().isAfter(end)) continue;

            if (opp.getAmount() != null) {
                totalPipeline = totalPipeline.add(opp.getAmount());
                weightedPipeline = weightedPipeline.add(opp.getWeightedPipeline());
            }
        }

        response.setTotalPipelineValue(totalPipeline);
        response.setWeightedPipelineValue(weightedPipeline);

        long overdueCount = followUpRepository.countOverdue(Instant.now(), scopedUserIds);
        response.setOverdueFollowUpsCount(overdueCount);

        // 2. Chart: Lead Status Distribution
        Map<LeadStatus, Long> leadStatusCountMap = new LinkedHashMap<>();
        for (LeadStatus ls : LeadStatus.values()) {
            leadStatusCountMap.put(ls, 0L);
        }
        List<Object[]> leadStatusGroup = leadRepository.countGroupByStatus(scopedUserIds, start, end);
        for (Object[] row : leadStatusGroup) {
            LeadStatus ls = (LeadStatus) row[0];
            Long count = ((Number) row[1]).longValue();
            leadStatusCountMap.put(ls, count);
        }
        List<LeadStatusSummaryDto> leadStatusList = leadStatusCountMap.entrySet().stream()
                .map(e -> new LeadStatusSummaryDto(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
        response.setLeadStatusDistribution(leadStatusList);

        // 3. Chart: Opportunity Pipeline by Stage
        Map<OpportunityStage, StageSummaryDto> stageMap = new LinkedHashMap<>();
        for (OpportunityStage st : OpportunityStage.values()) {
            stageMap.put(st, new StageSummaryDto(st, 0, BigDecimal.ZERO));
        }
        List<Object[]> stageAgg = opportunityRepository.aggregateByStage(scopedUserIds, start, end);
        for (Object[] row : stageAgg) {
            OpportunityStage st = (OpportunityStage) row[0];
            Long count = ((Number) row[1]).longValue();
            BigDecimal sumAmt = (BigDecimal) row[2];
            stageMap.put(st, new StageSummaryDto(st, count, sumAmt != null ? sumAmt : BigDecimal.ZERO));
        }
        response.setOpportunityPipeline(new ArrayList<>(stageMap.values()));

        // 4. Chart: Monthly Sales Performance (Last 6 Months)
        List<MonthlySalesDto> monthlySales = calculateMonthlySales(oppList, scopedUserIds);
        response.setMonthlySalesPerformance(monthlySales);

        // 5. Recent Widgets
        response.setRecentActivities(
                activityRepository.findRecentActivities(scopedUserIds, PageRequest.of(0, 5)).stream()
                        .map(ActivityResponse::fromEntity)
                        .collect(Collectors.toList())
        );

        response.setUpcomingFollowUps(
                followUpRepository.findUpcoming(Instant.now(), scopedUserIds, PageRequest.of(0, 5)).stream()
                        .map(FollowUpResponse::fromEntity)
                        .collect(Collectors.toList())
        );

        response.setOverdueFollowUps(
                followUpRepository.findOverdue(Instant.now(), scopedUserIds, PageRequest.of(0, 5)).stream()
                        .map(FollowUpResponse::fromEntity)
                        .collect(Collectors.toList())
        );

        response.setRecentLeads(
                leadRepository.searchLeads(null, null, null, null, null, scopedUserIds, PageRequest.of(0, 5)).getContent().stream()
                        .map(LeadResponse::fromEntity)
                        .collect(Collectors.toList())
        );

        List<OpportunityResponse> topOpps = oppList.stream()
                .filter(o -> {
                    if (scopedUserIds == null) return true;
                    Long assignedId = o.getAssignedTo() != null ? o.getAssignedTo().getId() : null;
                    Long createdById = o.getCreatedBy() != null ? o.getCreatedBy().getId() : null;
                    return (assignedId != null && scopedUserIds.contains(assignedId)) ||
                           (createdById != null && scopedUserIds.contains(createdById));
                })
                .sorted((a, b) -> b.getAmount().compareTo(a.getAmount()))
                .limit(5)
                .map(OpportunityResponse::fromEntity)
                .collect(Collectors.toList());
        response.setTopOpportunities(topOpps);

        return response;
    }

    private List<MonthlySalesDto> calculateMonthlySales(List<Opportunity> allOpps, Collection<Long> scopedUserIds) {
        YearMonth current = YearMonth.now();
        List<YearMonth> last6Months = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            last6Months.add(current.minusMonths(i));
        }

        Map<YearMonth, MonthlySalesDto> monthMap = new LinkedHashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");
        for (YearMonth ym : last6Months) {
            monthMap.put(ym, new MonthlySalesDto(ym.format(formatter), BigDecimal.ZERO, 0));
        }

        for (Opportunity opp : allOpps) {
            if (opp.getStage() != OpportunityStage.WON) continue;
            if (scopedUserIds != null) {
                Long assignedId = opp.getAssignedTo() != null ? opp.getAssignedTo().getId() : null;
                Long createdById = opp.getCreatedBy() != null ? opp.getCreatedBy().getId() : null;
                boolean inScope = (assignedId != null && scopedUserIds.contains(assignedId)) ||
                                 (createdById != null && scopedUserIds.contains(createdById));
                if (!inScope) continue;
            }

            LocalDate closeDate = opp.getExpectedCloseDate();
            if (closeDate != null) {
                YearMonth ym = YearMonth.from(closeDate);
                if (monthMap.containsKey(ym)) {
                    MonthlySalesDto dto = monthMap.get(ym);
                    dto.setWonCount(dto.getWonCount() + 1);
                    dto.setWonAmount(dto.getWonAmount().add(opp.getAmount()));
                }
            }
        }

        return new ArrayList<>(monthMap.values());
    }

    private Instant[] resolveDateRange(String period, Instant customStart, Instant customEnd) {
        if ("CUSTOM".equalsIgnoreCase(period) && customStart != null && customEnd != null) {
            return new Instant[]{customStart, customEnd};
        }

        ZoneId zone = ZoneOffset.UTC;
        LocalDate today = LocalDate.now(zone);

        if ("TODAY".equalsIgnoreCase(period)) {
            Instant start = today.atStartOfDay(zone).toInstant();
            Instant end = today.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1);
            return new Instant[]{start, end};
        } else if ("THIS_WEEK".equalsIgnoreCase(period)) {
            LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            Instant start = startOfWeek.atStartOfDay(zone).toInstant();
            Instant end = today.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1);
            return new Instant[]{start, end};
        } else if ("THIS_MONTH".equalsIgnoreCase(period)) {
            LocalDate startOfMonth = today.withDayOfMonth(1);
            Instant start = startOfMonth.atStartOfDay(zone).toInstant();
            Instant end = today.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1);
            return new Instant[]{start, end};
        }

        // Default or "ALL": no start/end boundary
        return new Instant[]{null, null};
    }
}

