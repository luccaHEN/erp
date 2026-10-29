package com.erpflow.product.service;

import com.erpflow.company.domain.Company;
import com.erpflow.company.repository.CompanyRepository;
import com.erpflow.product.domain.Category;
import com.erpflow.product.dto.CategoryRequest;
import com.erpflow.product.dto.CategoryResponse;
import com.erpflow.product.repository.CategoryRepository;
import com.erpflow.shared.exception.BusinessException;
import com.erpflow.shared.exception.ResourceNotFoundException;
import com.erpflow.shared.security.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CompanyRepository companyRepository;

    public CategoryService(CategoryRepository categoryRepository, CompanyRepository companyRepository) {
        this.categoryRepository = categoryRepository;
        this.companyRepository = companyRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> findAll() {
        Long companyId = TenantContext.getCurrentCompanyId();
        return categoryRepository.findByCompanyIdOrderByNameAsc(companyId).stream()
                .map(CategoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryResponse findById(Long id) {
        Long companyId = TenantContext.getCurrentCompanyId();
        Category category = categoryRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria", id));
        return CategoryResponse.fromEntity(category);
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        Long companyId = TenantContext.getCurrentCompanyId();
        String name = request.getName().trim();

        if (categoryRepository.existsByCompanyIdAndName(companyId, name)) {
            throw new BusinessException("Já existe uma categoria cadastrada com o nome: " + name);
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa", companyId));

        Category category = new Category();
        category.setCompany(company);
        category.setName(name);
        category.setDescription(request.getDescription());
        category.setActive(request.isActive());

        return CategoryResponse.fromEntity(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Long companyId = TenantContext.getCurrentCompanyId();
        Category category = categoryRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria", id));

        String newName = request.getName().trim();
        if (!newName.equalsIgnoreCase(category.getName()) && categoryRepository.existsByCompanyIdAndName(companyId, newName)) {
            throw new BusinessException("Já existe uma categoria cadastrada com o nome: " + newName);
        }

        category.setName(newName);
        category.setDescription(request.getDescription());
        category.setActive(request.isActive());

        return CategoryResponse.fromEntity(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse toggleStatus(Long id) {
        Long companyId = TenantContext.getCurrentCompanyId();
        Category category = categoryRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria", id));

        category.setActive(!category.isActive());
        return CategoryResponse.fromEntity(categoryRepository.save(category));
    }
}
