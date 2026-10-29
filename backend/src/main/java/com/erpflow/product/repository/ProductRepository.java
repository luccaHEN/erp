package com.erpflow.product.repository;

import com.erpflow.product.domain.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    @Query("SELECT p FROM Product p " +
           "LEFT JOIN FETCH p.category " +
           "LEFT JOIN FETCH p.supplier " +
           "WHERE p.id = :id AND p.company.id = :companyId")
    Optional<Product> findByIdAndCompanyId(@Param("id") Long id, @Param("companyId") Long companyId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id AND p.company.id = :companyId")
    Optional<Product> findByIdAndCompanyIdWithLock(@Param("id") Long id, @Param("companyId") Long companyId);

    boolean existsByCompanyIdAndSku(Long companyId, String sku);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.company.id = :companyId AND p.active = true AND p.currentStock <= p.minStock")
    long countLowStockByCompanyId(@Param("companyId") Long companyId);
}
