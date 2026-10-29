package com.erpflow.audit.repository;

import com.erpflow.audit.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    @Query(value = "SELECT a FROM AuditLog a LEFT JOIN FETCH a.user WHERE a.company.id = :companyId ORDER BY a.createdAt DESC",
           countQuery = "SELECT COUNT(a) FROM AuditLog a WHERE a.company.id = :companyId")
    Page<AuditLog> findByCompanyIdWithUser(@Param("companyId") Long companyId, Pageable pageable);
}
