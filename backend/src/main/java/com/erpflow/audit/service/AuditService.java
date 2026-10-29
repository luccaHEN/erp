package com.erpflow.audit.service;

import com.erpflow.audit.domain.AuditLog;
import com.erpflow.audit.dto.AuditLogResponse;
import com.erpflow.audit.repository.AuditLogRepository;
import com.erpflow.company.domain.Company;
import com.erpflow.company.repository.CompanyRepository;
import com.erpflow.shared.security.TenantContext;
import com.erpflow.user.domain.User;
import com.erpflow.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public AuditService(AuditLogRepository auditLogRepository,
                        CompanyRepository companyRepository,
                        UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String entityName, String entityId, String detailsJson) {
        Long companyId = TenantContext.getCurrentCompanyId();
        Long userId = TenantContext.getCurrentUserId();

        Company company = null;
        if (companyId != null) {
            company = companyRepository.findById(companyId).orElse(null);
        }

        User user = null;
        String userEmail = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                userEmail = user.getEmail();
            }
        }

        AuditLog log = new AuditLog(company, user, userEmail, action, entityName, entityId, detailsJson);
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> listLogs(Pageable pageable) {
        Long companyId = TenantContext.getCurrentCompanyId();
        return auditLogRepository.findByCompanyIdWithUser(companyId, pageable)
                .map(AuditLogResponse::fromEntity);
    }
}
