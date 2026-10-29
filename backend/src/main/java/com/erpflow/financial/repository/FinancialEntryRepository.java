package com.erpflow.financial.repository;

import com.erpflow.financial.domain.FinancialEntry;
import com.erpflow.financial.domain.FinancialStatus;
import com.erpflow.financial.domain.FinancialType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FinancialEntryRepository extends JpaRepository<FinancialEntry, Long>, JpaSpecificationExecutor<FinancialEntry> {

    @Query("SELECT fe FROM FinancialEntry fe " +
           "LEFT JOIN FETCH fe.customer " +
           "LEFT JOIN FETCH fe.supplier " +
           "WHERE fe.id = :id AND fe.company.id = :companyId")
    Optional<FinancialEntry> findByIdAndCompanyId(@Param("id") Long id, @Param("companyId") Long companyId);

    List<FinancialEntry> findByCompanyIdAndSaleId(Long companyId, Long saleId);

    @Query("SELECT COALESCE(SUM(fe.amount), 0) FROM FinancialEntry fe " +
           "WHERE fe.company.id = :companyId AND fe.type = :type AND fe.status = :status")
    BigDecimal sumAmountByCompanyIdAndTypeAndStatus(
            @Param("companyId") Long companyId,
            @Param("type") FinancialType type,
            @Param("status") FinancialStatus status
    );

    @Query("SELECT COALESCE(SUM(fe.amount), 0) FROM FinancialEntry fe " +
           "WHERE fe.company.id = :companyId AND fe.type = :type AND fe.status = 'PENDENTE' AND fe.dueDate < :today")
    BigDecimal sumOverdueAmount(
            @Param("companyId") Long companyId,
            @Param("type") FinancialType type,
            @Param("today") LocalDate today
    );
}
