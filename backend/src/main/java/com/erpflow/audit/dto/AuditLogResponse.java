package com.erpflow.audit.dto;

import com.erpflow.audit.domain.AuditLog;
import java.time.OffsetDateTime;

public record AuditLogResponse(
        Long id,
        Long userId,
        String userName,
        String userEmail,
        String action,
        String entityName,
        String entityId,
        String ipAddress,
        String detailsJson,
        OffsetDateTime createdAt
) {
    public static AuditLogResponse fromEntity(AuditLog log) {
        String userName = log.getUser() != null ? log.getUser().getName() : "Sistema";
        Long userId = log.getUser() != null ? log.getUser().getId() : null;
        return new AuditLogResponse(
                log.getId(),
                userId,
                userName,
                log.getUserEmail(),
                log.getAction(),
                log.getEntityName(),
                log.getEntityId(),
                log.getIpAddress(),
                log.getDetailsJson(),
                log.getCreatedAt()
        );
    }
}
