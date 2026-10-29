package com.erpflow.sales.repository;

import com.erpflow.sales.domain.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long>, JpaSpecificationExecutor<Sale> {

    @Query("SELECT s FROM Sale s " +
           "LEFT JOIN FETCH s.customer " +
           "JOIN FETCH s.user " +
           "LEFT JOIN FETCH s.items i " +
           "LEFT JOIN FETCH i.product " +
           "WHERE s.id = :id AND s.company.id = :companyId")
    Optional<Sale> findByIdAndCompanyIdWithDetails(@Param("id") Long id, @Param("companyId") Long companyId);

    Optional<Sale> findByIdAndCompanyId(Long id, Long companyId);

    long countByCompanyId(Long companyId);

    @Query("""
        SELECT COALESCE(SUM(s.totalAmount), 0)
        FROM Sale s
        WHERE s.company.id = :companyId
          AND s.status = com.erpflow.sales.domain.SaleStatus.CONFIRMADA
          AND s.saleDate >= :startDate
    """)
    java.math.BigDecimal sumConfirmedSalesByCompanySince(@Param("companyId") Long companyId, @Param("startDate") java.time.OffsetDateTime startDate);

    @Query("""
        SELECT COUNT(s)
        FROM Sale s
        WHERE s.company.id = :companyId
          AND s.status = com.erpflow.sales.domain.SaleStatus.CONFIRMADA
          AND s.saleDate >= :startDate
    """)
    long countConfirmedSalesByCompanySince(@Param("companyId") Long companyId, @Param("startDate") java.time.OffsetDateTime startDate);

    @Query("""
        SELECT s
        FROM Sale s
        WHERE s.company.id = :companyId
          AND s.status = com.erpflow.sales.domain.SaleStatus.CONFIRMADA
          AND s.saleDate >= :startDate
        ORDER BY s.saleDate ASC
    """)
    java.util.List<Sale> findConfirmedSalesSince(@Param("companyId") Long companyId, @Param("startDate") java.time.OffsetDateTime startDate);
}
