package com.erpflow.supplier.repository;

import com.erpflow.supplier.domain.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long>, JpaSpecificationExecutor<Supplier> {

    Optional<Supplier> findByIdAndCompanyId(Long id, Long companyId);

    boolean existsByCompanyIdAndDocument(Long companyId, String document);
}
