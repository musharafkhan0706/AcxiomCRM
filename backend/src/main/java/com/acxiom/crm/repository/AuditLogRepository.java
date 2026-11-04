package com.acxiom.crm.repository;

import com.acxiom.crm.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:entityName IS NULL OR a.entityName = :entityName) AND " +
           "(:userId IS NULL OR a.userId = :userId) AND " +
           "(:startDate IS NULL OR a.timestamp >= :startDate) AND " +
           "(:endDate IS NULL OR a.timestamp <= :endDate) AND " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(a.username) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(a.details) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(a.recordId) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<AuditLog> searchLogs(@Param("query") String query,
                             @Param("action") String action,
                             @Param("entityName") String entityName,
                             @Param("userId") Long userId,
                             @Param("startDate") Instant startDate,
                             @Param("endDate") Instant endDate,
                             Pageable pageable);

    List<AuditLog> findByEntityNameAndRecordIdOrderByTimestampDesc(String entityName, String recordId);
}

