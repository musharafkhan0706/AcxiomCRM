package com.acxiom.crm.repository;

import com.acxiom.crm.entity.Opportunity;
import com.acxiom.crm.entity.OpportunityStage;
import com.acxiom.crm.entity.OpportunityStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.List;

@Repository
public interface OpportunityRepository extends JpaRepository<Opportunity, Long> {

    @Query("SELECT o FROM Opportunity o WHERE " +
           "(:scopedUserIds IS NULL OR o.assignedTo.id IN :scopedUserIds OR o.createdBy.id IN :scopedUserIds) AND " +
           "(:stage IS NULL OR o.stage = :stage) AND " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:customerId IS NULL OR o.customer.id = :customerId) AND " +
           "(:assignedUserId IS NULL OR o.assignedTo.id = :assignedUserId) AND " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(o.opportunityName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(o.customer.customerName) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Opportunity> searchOpportunities(@Param("query") String query,
                                          @Param("stage") OpportunityStage stage,
                                          @Param("status") OpportunityStatus status,
                                          @Param("customerId") Long customerId,
                                          @Param("assignedUserId") Long assignedUserId,
                                          @Param("scopedUserIds") Collection<Long> scopedUserIds,
                                          Pageable pageable);

    @Query("SELECT COUNT(o) FROM Opportunity o WHERE " +
           "(:scopedUserIds IS NULL OR o.assignedTo.id IN :scopedUserIds OR o.createdBy.id IN :scopedUserIds) AND " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:stage IS NULL OR o.stage = :stage) AND " +
           "(:startDate IS NULL OR o.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR o.createdAt <= :endDate)")
    long countWithFilters(@Param("status") OpportunityStatus status,
                          @Param("stage") OpportunityStage stage,
                          @Param("scopedUserIds") Collection<Long> scopedUserIds,
                          @Param("startDate") Instant startDate,
                          @Param("endDate") Instant endDate);

    @Query("SELECT COALESCE(SUM(o.amount), 0) FROM Opportunity o WHERE " +
           "(:scopedUserIds IS NULL OR o.assignedTo.id IN :scopedUserIds OR o.createdBy.id IN :scopedUserIds) AND " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:startDate IS NULL OR o.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR o.createdAt <= :endDate)")
    BigDecimal sumAmountWithFilters(@Param("status") OpportunityStatus status,
                                    @Param("scopedUserIds") Collection<Long> scopedUserIds,
                                    @Param("startDate") Instant startDate,
                                    @Param("endDate") Instant endDate);

    @Query("SELECT o.stage, COUNT(o), COALESCE(SUM(o.amount), 0) FROM Opportunity o WHERE " +
           "(:scopedUserIds IS NULL OR o.assignedTo.id IN :scopedUserIds OR o.createdBy.id IN :scopedUserIds) AND " +
           "(:startDate IS NULL OR o.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR o.createdAt <= :endDate) " +
           "GROUP BY o.stage")
    List<Object[]> aggregateByStage(@Param("scopedUserIds") Collection<Long> scopedUserIds,
                                    @Param("startDate") Instant startDate,
                                    @Param("endDate") Instant endDate);

    List<Opportunity> findByCustomerId(Long customerId);

    List<Opportunity> findByLeadId(Long leadId);
}

