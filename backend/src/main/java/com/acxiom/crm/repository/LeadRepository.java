package com.acxiom.crm.repository;

import com.acxiom.crm.entity.Lead;
import com.acxiom.crm.entity.LeadSource;
import com.acxiom.crm.entity.LeadStatus;
import com.acxiom.crm.entity.Priority;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    Optional<Lead> findByLeadCode(String leadCode);

    @Query("SELECT l FROM Lead l WHERE " +
           "(:scopedUserIds IS NULL OR l.assignedTo.id IN :scopedUserIds OR l.createdBy.id IN :scopedUserIds) AND " +
           "(:status IS NULL OR l.status = :status) AND " +
           "(:priority IS NULL OR l.priority = :priority) AND " +
           "(:source IS NULL OR l.source = :source) AND " +
           "(:assignedUserId IS NULL OR l.assignedTo.id = :assignedUserId) AND " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(l.leadName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(l.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(l.phone) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(l.companyName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(l.leadCode) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Lead> searchLeads(@Param("query") String query,
                           @Param("status") LeadStatus status,
                           @Param("priority") Priority priority,
                           @Param("source") LeadSource source,
                           @Param("assignedUserId") Long assignedUserId,
                           @Param("scopedUserIds") Collection<Long> scopedUserIds,
                           Pageable pageable);

    @Query("SELECT COUNT(l) FROM Lead l WHERE " +
           "(:scopedUserIds IS NULL OR l.assignedTo.id IN :scopedUserIds OR l.createdBy.id IN :scopedUserIds) AND " +
           "(:status IS NULL OR l.status = :status) AND " +
           "(:startDate IS NULL OR l.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR l.createdAt <= :endDate)")
    long countWithFilters(@Param("status") LeadStatus status,
                          @Param("scopedUserIds") Collection<Long> scopedUserIds,
                          @Param("startDate") Instant startDate,
                          @Param("endDate") Instant endDate);

    @Query("SELECT l.status, COUNT(l) FROM Lead l WHERE " +
           "(:scopedUserIds IS NULL OR l.assignedTo.id IN :scopedUserIds OR l.createdBy.id IN :scopedUserIds) AND " +
           "(:startDate IS NULL OR l.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR l.createdAt <= :endDate) " +
           "GROUP BY l.status")
    List<Object[]> countGroupByStatus(@Param("scopedUserIds") Collection<Long> scopedUserIds,
                                      @Param("startDate") Instant startDate,
                                      @Param("endDate") Instant endDate);

    List<Lead> findByConvertedCustomerId(Long customerId);

    Optional<Lead> findTopByOrderByIdDesc();
}

