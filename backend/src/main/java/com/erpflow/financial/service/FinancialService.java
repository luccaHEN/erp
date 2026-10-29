package com.erpflow.financial.service;

import com.erpflow.company.domain.Company;
import com.erpflow.company.repository.CompanyRepository;
import com.erpflow.customer.domain.Customer;
import com.erpflow.customer.repository.CustomerRepository;
import com.erpflow.financial.domain.FinancialEntry;
import com.erpflow.financial.domain.FinancialStatus;
import com.erpflow.financial.domain.FinancialType;
import com.erpflow.financial.domain.PaymentMethod;
import com.erpflow.financial.dto.FinancialEntryRequest;
import com.erpflow.financial.dto.FinancialEntryResponse;
import com.erpflow.financial.dto.FinancialSummaryResponse;
import com.erpflow.financial.repository.FinancialEntryRepository;
import com.erpflow.shared.exception.BusinessException;
import com.erpflow.shared.exception.ResourceNotFoundException;
import com.erpflow.shared.security.TenantContext;
import com.erpflow.supplier.domain.Supplier;
import com.erpflow.supplier.repository.SupplierRepository;
import com.erpflow.user.domain.User;
import com.erpflow.user.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class FinancialService {

    private final FinancialEntryRepository financialEntryRepository;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;

    public FinancialService(FinancialEntryRepository financialEntryRepository,
                            CustomerRepository customerRepository,
                            SupplierRepository supplierRepository,
                            UserRepository userRepository,
                            CompanyRepository companyRepository) {
        this.financialEntryRepository = financialEntryRepository;
        this.customerRepository = customerRepository;
        this.supplierRepository = supplierRepository;
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
    }

    @Transactional(readOnly = true)
    public Page<FinancialEntryResponse> search(FinancialType type,
                                              FinancialStatus status,
                                              String search,
                                              LocalDate startDate,
                                              LocalDate endDate,
                                              Pageable pageable) {
        Long companyId = TenantContext.getCurrentCompanyId();

        Specification<FinancialEntry> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("company").get("id"), companyId));

            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("description")), pattern),
                        cb.like(cb.lower(root.get("category")), pattern)
                ));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("dueDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("dueDate"), endDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return financialEntryRepository.findAll(spec, pageable)
                .map(FinancialEntryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public FinancialEntryResponse findById(Long id) {
        Long companyId = TenantContext.getCurrentCompanyId();
        FinancialEntry entry = financialEntryRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Lançamento Financeiro", id));
        return FinancialEntryResponse.fromEntity(entry);
    }

    @Transactional
    public FinancialEntryResponse create(FinancialEntryRequest request) {
        Long companyId = TenantContext.getCurrentCompanyId();
        Long userId = TenantContext.getCurrentUserId();

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa", companyId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", userId));

        FinancialEntry entry = new FinancialEntry();
        entry.setCompany(company);
        entry.setUser(user);
        applyData(entry, request, companyId);

        return FinancialEntryResponse.fromEntity(financialEntryRepository.save(entry));
    }

    @Transactional
    public FinancialEntryResponse update(Long id, FinancialEntryRequest request) {
        Long companyId = TenantContext.getCurrentCompanyId();
        FinancialEntry entry = financialEntryRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Lançamento Financeiro", id));

        if (entry.getStatus() == FinancialStatus.CANCELADO) {
            throw new BusinessException("Não é permitido editar um lançamento cancelado.");
        }

        applyData(entry, request, companyId);
        return FinancialEntryResponse.fromEntity(financialEntryRepository.save(entry));
    }

    @Transactional
    public FinancialEntryResponse settle(Long id, LocalDate paymentDate, PaymentMethod paymentMethod) {
        Long companyId = TenantContext.getCurrentCompanyId();
        FinancialEntry entry = financialEntryRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Lançamento Financeiro", id));

        if (entry.getStatus() == FinancialStatus.PAGO) {
            throw new BusinessException("Este título financeiro já foi liquidado anteriormente.");
        }
        if (entry.getStatus() == FinancialStatus.CANCELADO) {
            throw new BusinessException("Não é possível liquidar um título cancelado.");
        }

        entry.setStatus(FinancialStatus.PAGO);
        entry.setPaymentDate(paymentDate != null ? paymentDate : LocalDate.now());
        if (paymentMethod != null) {
            entry.setPaymentMethod(paymentMethod);
        }

        return FinancialEntryResponse.fromEntity(financialEntryRepository.save(entry));
    }

    @Transactional
    public FinancialEntryResponse cancel(Long id) {
        Long companyId = TenantContext.getCurrentCompanyId();
        FinancialEntry entry = financialEntryRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Lançamento Financeiro", id));

        if (entry.getStatus() == FinancialStatus.CANCELADO) {
            throw new BusinessException("Este título já se encontra cancelado.");
        }
        if (entry.getStatus() == FinancialStatus.PAGO) {
            throw new BusinessException("Não é permitido cancelar diretamente um título já pago/recebido.");
        }

        entry.setStatus(FinancialStatus.CANCELADO);
        return FinancialEntryResponse.fromEntity(financialEntryRepository.save(entry));
    }

    @Transactional(readOnly = true)
    public FinancialSummaryResponse getSummary() {
        Long companyId = TenantContext.getCurrentCompanyId();
        LocalDate today = LocalDate.now();

        BigDecimal pendingReceivables = financialEntryRepository.sumAmountByCompanyIdAndTypeAndStatus(
                companyId, FinancialType.RECEBER, FinancialStatus.PENDENTE);
        BigDecimal pendingPayables = financialEntryRepository.sumAmountByCompanyIdAndTypeAndStatus(
                companyId, FinancialType.PAGAR, FinancialStatus.PENDENTE);

        BigDecimal overdueReceivables = financialEntryRepository.sumOverdueAmount(
                companyId, FinancialType.RECEBER, today);
        BigDecimal overduePayables = financialEntryRepository.sumOverdueAmount(
                companyId, FinancialType.PAGAR, today);

        return new FinancialSummaryResponse(
                pendingReceivables,
                pendingPayables,
                overdueReceivables,
                overduePayables
        );
    }

    private void applyData(FinancialEntry entry, FinancialEntryRequest request, Long companyId) {
        entry.setDescription(request.getDescription().trim());
        entry.setType(request.getType());
        entry.setCategory(request.getCategory().trim());
        entry.setAmount(request.getAmount());
        entry.setDueDate(request.getDueDate());
        entry.setPaymentDate(request.getPaymentDate());
        entry.setStatus(request.getStatus() != null ? request.getStatus() : FinancialStatus.PENDENTE);
        entry.setPaymentMethod(request.getPaymentMethod());
        entry.setNotes(request.getNotes());

        if (request.getCustomerId() != null) {
            Customer customer = customerRepository.findByIdAndCompanyId(request.getCustomerId(), companyId)
                    .orElseThrow(() -> new BusinessException("Cliente inválido para esta empresa."));
            entry.setCustomer(customer);
        } else {
            entry.setCustomer(null);
        }

        if (request.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findByIdAndCompanyId(request.getSupplierId(), companyId)
                    .orElseThrow(() -> new BusinessException("Fornecedor inválido para esta empresa."));
            entry.setSupplier(supplier);
        } else {
            entry.setSupplier(null);
        }
    }
}
