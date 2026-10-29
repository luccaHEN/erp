package com.erpflow.supplier.service;

import com.erpflow.company.domain.Company;
import com.erpflow.company.repository.CompanyRepository;
import com.erpflow.shared.exception.BusinessException;
import com.erpflow.shared.exception.ResourceNotFoundException;
import com.erpflow.shared.security.TenantContext;
import com.erpflow.supplier.domain.Supplier;
import com.erpflow.supplier.dto.SupplierRequest;
import com.erpflow.supplier.dto.SupplierResponse;
import com.erpflow.supplier.repository.SupplierRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final CompanyRepository companyRepository;

    public SupplierService(SupplierRepository supplierRepository, CompanyRepository companyRepository) {
        this.supplierRepository = supplierRepository;
        this.companyRepository = companyRepository;
    }

    @Transactional(readOnly = true)
    public Page<SupplierResponse> search(String search, Boolean active, Pageable pageable) {
        Long companyId = TenantContext.getCurrentCompanyId();

        Specification<Supplier> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("company").get("id"), companyId));

            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("corporateName")), pattern),
                        cb.like(cb.lower(root.get("tradeName")), pattern),
                        cb.like(root.get("document"), "%" + search.trim() + "%")
                ));
            }

            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return supplierRepository.findAll(spec, pageable).map(SupplierResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public SupplierResponse findById(Long id) {
        Long companyId = TenantContext.getCurrentCompanyId();
        Supplier supplier = supplierRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Fornecedor", id));
        return SupplierResponse.fromEntity(supplier);
    }

    @Transactional
    public SupplierResponse create(SupplierRequest request) {
        Long companyId = TenantContext.getCurrentCompanyId();
        String doc = request.getDocument().trim();

        if (supplierRepository.existsByCompanyIdAndDocument(companyId, doc)) {
            throw new BusinessException("Já existe um fornecedor cadastrado com este documento nesta empresa.");
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa", companyId));

        Supplier supplier = new Supplier();
        supplier.setCompany(company);
        applyData(supplier, request);

        return SupplierResponse.fromEntity(supplierRepository.save(supplier));
    }

    @Transactional
    public SupplierResponse update(Long id, SupplierRequest request) {
        Long companyId = TenantContext.getCurrentCompanyId();
        Supplier supplier = supplierRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Fornecedor", id));

        String newDoc = request.getDocument().trim();
        if (!newDoc.equals(supplier.getDocument()) && supplierRepository.existsByCompanyIdAndDocument(companyId, newDoc)) {
            throw new BusinessException("Já existe um fornecedor cadastrado com este documento nesta empresa.");
        }

        applyData(supplier, request);
        return SupplierResponse.fromEntity(supplierRepository.save(supplier));
    }

    @Transactional
    public SupplierResponse toggleStatus(Long id) {
        Long companyId = TenantContext.getCurrentCompanyId();
        Supplier supplier = supplierRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Fornecedor", id));

        supplier.setActive(!supplier.isActive());
        return SupplierResponse.fromEntity(supplierRepository.save(supplier));
    }

    private void applyData(Supplier supplier, SupplierRequest request) {
        supplier.setCorporateName(request.getCorporateName() != null ? request.getCorporateName().trim() : null);
        supplier.setTradeName(StringUtils.hasText(request.getTradeName()) ? request.getTradeName().trim() : null);
        supplier.setDocument(request.getDocument() != null ? request.getDocument().trim() : null);
        supplier.setEmail(StringUtils.hasText(request.getEmail()) ? request.getEmail().trim() : null);
        supplier.setPhone(StringUtils.hasText(request.getPhone()) ? request.getPhone().trim() : null);
        supplier.setAddress(StringUtils.hasText(request.getAddress()) ? request.getAddress().trim() : null);
        supplier.setCity(StringUtils.hasText(request.getCity()) ? request.getCity().trim() : null);
        supplier.setState(StringUtils.hasText(request.getState()) ? request.getState().trim() : null);
        supplier.setZipCode(StringUtils.hasText(request.getZipCode()) ? request.getZipCode().trim() : null);
        supplier.setNotes(StringUtils.hasText(request.getNotes()) ? request.getNotes().trim() : null);
        supplier.setActive(request.isActive());
    }
}
