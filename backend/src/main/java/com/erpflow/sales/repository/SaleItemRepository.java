package com.erpflow.sales.repository;

import com.erpflow.dashboard.dto.TopProductDTO;
import com.erpflow.sales.domain.SaleItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {

    List<SaleItem> findBySaleId(Long saleId);

    @Query("""
        SELECT new com.erpflow.dashboard.dto.TopProductDTO(
            p.id,
            p.name,
            p.sku,
            SUM(i.quantity),
            SUM(i.subtotal)
        )
        FROM SaleItem i
        JOIN i.sale s
        JOIN i.product p
        WHERE s.company.id = :companyId
          AND s.status = com.erpflow.sales.domain.SaleStatus.CONFIRMADA
        GROUP BY p.id, p.name, p.sku
        ORDER BY SUM(i.subtotal) DESC
    """)
    List<TopProductDTO> findTopSellingProducts(@Param("companyId") Long companyId, Pageable pageable);
}

