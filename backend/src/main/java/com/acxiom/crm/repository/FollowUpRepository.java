package com.acxiom.crm.repository;

import com.acxiom.crm.entity.FollowUp;
import com.acxiom.crm.entity.FollowUpStatus;
import com.acxiom.crm.entity.FollowUpType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

@Repository
public interface FollowUpRepository extends JpaRepository<FollowUp, Long> {

    @Query("SELECT f FROM FollowUp f WHERE " +
           "(:scopedUserIds IS NULL OR f.assignedTo.id IN :scopedUserIds OR f.createdBy.id IN :scopedUserIds) AND " +
           "(:status IS NULL OR f.status = :status) AND " +
           "(:type IS NULL OR f.followUpType = :type) AND " +
           "(:customerId IS NULL OR f.customer.id = :customerId) AND " +
           "(:leadId IS NULL OR f.lead.id = :leadId) AND " +
           "(:opportunityId IS NULL OR f.opportunity.id = :opportunityId) AND " +
           "(:startDate IS NULL OR f.followUpDate >= :startDate) AND " +
           "(:endDate IS NULL OR f.followUpDate <= :endDate) AND " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(f.subject) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(f.notes) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<FollowUp> searchFollowUps(@Param("query") String query,
                                   @Param("status") FollowUpStatus status,
                                   @Param("type") FollowUpType type,
                                   @Param("customerId") Long customerId,
                                   @Param("leadId") Long leadId,
                                   @Param("opportunityId") Long opportunityId,
                                   @Param("startDate") Instant startDate,
                                   @Param("endDate") Instant endDate,
                                   @Param("scopedUserIds") Collection<Long> scopedUserIds,
                                   Pageable pageable);

    @Query("SELECT f FROM FollowUp f WHERE " +
           "(:scopedUserIds IS NULL OR f.assignedTo.id IN :scopedUserIds OR f.createdBy.id IN :scopedUserIds) AND " +
           "f.status = 'PLANNED' AND f.followUpDate >= :now " +
           "ORDER BY f.followUpDate ASC")
    List<FollowUp> findUpcoming(@Param("now") Instant now,
                                @Param("scopedUserIds") Collection<Long> scopedUserIds,
                                Pageable pageable);

    @Query("SELECT f FROM FollowUp f WHERE " +
           "(:scopedUserIds IS NULL OR f.assignedTo.id IN :scopedUserIds OR f.createdBy.id IN :scopedUserIds) AND " +
           "f.status = 'PLANNED' AND f.followUpDate < :now " +
           "ORDER BY f.followUpDate ASC")
    List<FollowUp> findOverdue(@Param("now") Instant now,
                               @Param("scopedUserIds") Collection<Long> scopedUserIds,
                               Pageable pageable);

    @Query("SELECT COUNT(f) FROM FollowUp f WHERE " +
           "(:scopedUserIds IS NULL OR f.assignedTo.id IN :scopedUserIds OR f.createdBy.id IN :scopedUserIds) AND " +
           "f.status = 'PLANNED' AND f.followUpDate < :now")
    long countOverdue(@Param("now") Instant now,
                      @Param("scopedUserIds") Collection<Long> scopedUserIds);

    List<FollowUp> findByCustomerId(Long customerId);
    List<FollowUp> findByLeadId(Long leadId);
    List<FollowUp> findByOpportunityId(Long opportunityId);
}

