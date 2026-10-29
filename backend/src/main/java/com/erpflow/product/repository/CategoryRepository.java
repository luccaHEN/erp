package com.erpflow.product.repository;

import com.erpflow.product.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByIdAndCompanyId(Long id, Long companyId);

    List<Category> findByCompanyIdOrderByNameAsc(Long companyId);

    boolean existsByCompanyIdAndName(Long companyId, String name);
}
