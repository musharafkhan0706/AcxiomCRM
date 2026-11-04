package com.acxiom.crm.repository;

import com.acxiom.crm.entity.Activity;
import com.acxiom.crm.entity.ActivityStatus;
import com.acxiom.crm.entity.ActivityType;
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
public interface ActivityRepository extends JpaRepository<Activity, Long> {

    @Query("SELECT a FROM Activity a WHERE " +
           "(:scopedUserIds IS NULL OR a.assignedTo.id IN :scopedUserIds OR a.createdBy.id IN :scopedUserIds) AND " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:type IS NULL OR a.activityType = :type) AND " +
           "(:customerId IS NULL OR a.customer.id = :customerId) AND " +
           "(:leadId IS NULL OR a.lead.id = :leadId) AND " +
           "(:opportunityId IS NULL OR a.opportunity.id = :opportunityId) AND " +
           "(:startDate IS NULL OR a.activityDate >= :startDate) AND " +
           "(:endDate IS NULL OR a.activityDate <= :endDate) AND " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(a.subject) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(a.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Activity> searchActivities(@Param("query") String query,
                                   @Param("status") ActivityStatus status,
                                   @Param("type") ActivityType type,
                                   @Param("customerId") Long customerId,
                                   @Param("leadId") Long leadId,
                                   @Param("opportunityId") Long opportunityId,
                                   @Param("startDate") Instant startDate,
                                   @Param("endDate") Instant endDate,
                                   @Param("scopedUserIds") Collection<Long> scopedUserIds,
                                   Pageable pageable);

    @Query("SELECT a FROM Activity a WHERE " +
           "(:scopedUserIds IS NULL OR a.assignedTo.id IN :scopedUserIds OR a.createdBy.id IN :scopedUserIds) " +
           "ORDER BY a.activityDate DESC")
    List<Activity> findRecentActivities(@Param("scopedUserIds") Collection<Long> scopedUserIds,
                                        Pageable pageable);

    List<Activity> findByCustomerIdOrderByActivityDateDesc(Long customerId);
    List<Activity> findByLeadIdOrderByActivityDateDesc(Long leadId);
    List<Activity> findByOpportunityIdOrderByActivityDateDesc(Long opportunityId);
}

