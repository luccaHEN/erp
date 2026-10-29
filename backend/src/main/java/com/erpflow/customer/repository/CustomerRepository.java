package com.erpflow.customer.repository;

import com.erpflow.customer.domain.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long>, JpaSpecificationExecutor<Customer> {

    Optional<Customer> findByIdAndCompanyId(Long id, Long companyId);

    boolean existsByCompanyIdAndDocument(Long companyId, String document);
}
