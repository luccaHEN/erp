package com.erpflow.inventory.repository;

import com.erpflow.inventory.domain.StockMovement;
import com.erpflow.inventory.domain.StockMovementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    @Query(value = "SELECT sm FROM StockMovement sm " +
           "JOIN FETCH sm.product p " +
           "JOIN FETCH sm.user u " +
           "WHERE sm.company.id = :companyId " +
           "AND (:productId IS NULL OR sm.product.id = :productId) " +
           "AND (:type IS NULL OR sm.type = :type) " +
           "ORDER BY sm.createdAt DESC",
           countQuery = "SELECT COUNT(sm) FROM StockMovement sm " +
           "WHERE sm.company.id = :companyId " +
           "AND (:productId IS NULL OR sm.product.id = :productId) " +
           "AND (:type IS NULL OR sm.type = :type)")
    Page<StockMovement> search(
            @Param("companyId") Long companyId,
            @Param("productId") Long productId,
            @Param("type") StockMovementType type,
            Pageable pageable
    );
}
