package com.erpflow.company.service;

import com.erpflow.company.domain.Company;
import com.erpflow.company.dto.CompanyRequest;
import com.erpflow.company.dto.CompanyResponse;
import com.erpflow.company.repository.CompanyRepository;
import com.erpflow.shared.exception.BusinessException;
import com.erpflow.shared.exception.ResourceNotFoundException;
import com.erpflow.shared.security.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;

    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    @Transactional(readOnly = true)
    public CompanyResponse getCurrentCompany() {
        Long companyId = TenantContext.getCurrentCompanyId();
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa", companyId));
        return CompanyResponse.fromEntity(company);
    }

    @Transactional(readOnly = true)
    public List<CompanyResponse> findAll() {
        return companyRepository.findAll().stream()
                .map(CompanyResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CompanyResponse findById(Long id) {
        Long currentCompanyId = TenantContext.getCurrentCompanyId();
        if (!id.equals(currentCompanyId)) {
            throw new BusinessException("Acesso negado: Você só pode visualizar a sua própria empresa.");
        }
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa", id));
        return CompanyResponse.fromEntity(company);
    }

    @Transactional
    public CompanyResponse update(Long id, CompanyRequest request) {
        Long currentCompanyId = TenantContext.getCurrentCompanyId();
        if (!id.equals(currentCompanyId)) {
            throw new BusinessException("Acesso negado: Você só pode alterar a sua própria empresa.");
        }

        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa", id));

        // Verifica unicidade de CNPJ se alterado
        if (!company.getCnpj().equals(request.getCnpj()) && companyRepository.existsByCnpj(request.getCnpj())) {
            throw new BusinessException("Já existe uma empresa cadastrada com o CNPJ informado.");
        }

        company.setCorporateName(request.getCorporateName());
        company.setTradeName(request.getTradeName());
        company.setCnpj(request.getCnpj());
        company.setEmail(request.getEmail());
        company.setPhone(request.getPhone());
        company.setAddress(request.getAddress());
        company.setCity(request.getCity());
        company.setState(request.getState());
        company.setZipCode(request.getZipCode());
        company.setActive(request.isActive());

        return CompanyResponse.fromEntity(companyRepository.save(company));
    }
}
