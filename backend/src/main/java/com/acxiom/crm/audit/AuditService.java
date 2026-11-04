package com.acxiom.crm.audit;

import com.acxiom.crm.dto.AuditLogResponse;
import com.acxiom.crm.dto.PagedResponse;
import com.acxiom.crm.entity.AuditLog;
import com.acxiom.crm.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(Long userId, String username, String action, String entityName,
                         String recordId, String oldValue, String newValue,
                         String result, String details, String ipAddress) {
        try {
            AuditLog auditLog = new AuditLog(userId, username, action, entityName, recordId,
                    oldValue, newValue, result, details, ipAddress);
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            // Audit logging should never prevent transaction completion
        }
    }

    @Transactional(readOnly = true)
    public PagedResponse<AuditLogResponse> searchLogs(String query, String action, String entityName,
                                                     Long userId, Instant startDate, Instant endDate,
                                                     Pageable pageable) {
        Page<AuditLog> page = auditLogRepository.searchLogs(query, action, entityName, userId, startDate, endDate, pageable);
        return PagedResponse.from(page.map(AuditLogResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getEntityHistory(String entityName, String recordId) {
        return auditLogRepository.findByEntityNameAndRecordIdOrderByTimestampDesc(entityName, recordId)
                .stream()
                .map(AuditLogResponse::fromEntity)
                .collect(Collectors.toList());
    }
}

