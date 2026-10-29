package com.erpflow.customer.service;

import com.erpflow.company.domain.Company;
import com.erpflow.company.repository.CompanyRepository;
import com.erpflow.customer.domain.Customer;
import com.erpflow.customer.dto.CustomerRequest;
import com.erpflow.customer.dto.CustomerResponse;
import com.erpflow.customer.repository.CustomerRepository;
import com.erpflow.shared.exception.BusinessException;
import com.erpflow.shared.exception.ResourceNotFoundException;
import com.erpflow.shared.security.TenantContext;
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
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CompanyRepository companyRepository;

    public CustomerService(CustomerRepository customerRepository, CompanyRepository companyRepository) {
        this.customerRepository = customerRepository;
        this.companyRepository = companyRepository;
    }

    @Transactional(readOnly = true)
    public Page<CustomerResponse> search(String search, Boolean active, Pageable pageable) {
        Long companyId = TenantContext.getCurrentCompanyId();

        Specification<Customer> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("company").get("id"), companyId));

            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(root.get("document"), "%" + search.trim() + "%")
                ));
            }

            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return customerRepository.findAll(spec, pageable).map(CustomerResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public CustomerResponse findById(Long id) {
        Long companyId = TenantContext.getCurrentCompanyId();
        Customer customer = customerRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", id));
        return CustomerResponse.fromEntity(customer);
    }

    @Transactional
    public CustomerResponse create(CustomerRequest request) {
        Long companyId = TenantContext.getCurrentCompanyId();
        String doc = StringUtils.hasText(request.getDocument()) ? request.getDocument().trim() : null;

        if (doc != null && customerRepository.existsByCompanyIdAndDocument(companyId, doc)) {
            throw new BusinessException("Já existe um cliente cadastrado com este documento nesta empresa.");
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa", companyId));

        Customer customer = new Customer();
        customer.setCompany(company);
        applyData(customer, request);

        return CustomerResponse.fromEntity(customerRepository.save(customer));
    }

    @Transactional
    public CustomerResponse update(Long id, CustomerRequest request) {
        Long companyId = TenantContext.getCurrentCompanyId();
        Customer customer = customerRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", id));

        String newDoc = StringUtils.hasText(request.getDocument()) ? request.getDocument().trim() : null;
        if (newDoc != null && !newDoc.equals(customer.getDocument()) && customerRepository.existsByCompanyIdAndDocument(companyId, newDoc)) {
            throw new BusinessException("Já existe um cliente cadastrado com este documento nesta empresa.");
        }

        applyData(customer, request);
        return CustomerResponse.fromEntity(customerRepository.save(customer));
    }

    @Transactional
    public CustomerResponse toggleStatus(Long id) {
        Long companyId = TenantContext.getCurrentCompanyId();
        Customer customer = customerRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", id));

        customer.setActive(!customer.isActive());
        return CustomerResponse.fromEntity(customerRepository.save(customer));
    }

    private void applyData(Customer customer, CustomerRequest request) {
        customer.setName(request.getName() != null ? request.getName().trim() : null);
        customer.setDocument(StringUtils.hasText(request.getDocument()) ? request.getDocument().trim() : null);
        customer.setEmail(StringUtils.hasText(request.getEmail()) ? request.getEmail().trim() : null);
        customer.setPhone(StringUtils.hasText(request.getPhone()) ? request.getPhone().trim() : null);
        customer.setAddress(StringUtils.hasText(request.getAddress()) ? request.getAddress().trim() : null);
        customer.setCity(StringUtils.hasText(request.getCity()) ? request.getCity().trim() : null);
        customer.setState(StringUtils.hasText(request.getState()) ? request.getState().trim() : null);
        customer.setZipCode(StringUtils.hasText(request.getZipCode()) ? request.getZipCode().trim() : null);
        customer.setNotes(StringUtils.hasText(request.getNotes()) ? request.getNotes().trim() : null);
        customer.setActive(request.isActive());
    }
}
