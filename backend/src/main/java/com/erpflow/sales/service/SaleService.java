package com.erpflow.sales.service;

import com.erpflow.audit.service.AuditService;
import com.erpflow.company.domain.Company;
import com.erpflow.company.repository.CompanyRepository;
import com.erpflow.customer.domain.Customer;
import com.erpflow.customer.repository.CustomerRepository;
import com.erpflow.financial.domain.FinancialEntry;
import com.erpflow.financial.domain.FinancialStatus;
import com.erpflow.financial.domain.FinancialType;
import com.erpflow.financial.domain.PaymentMethod;
import com.erpflow.financial.repository.FinancialEntryRepository;
import com.erpflow.inventory.domain.StockMovementType;
import com.erpflow.inventory.service.InventoryService;
import com.erpflow.product.domain.Product;
import com.erpflow.product.repository.ProductRepository;
import com.erpflow.sales.domain.Sale;
import com.erpflow.sales.domain.SaleItem;
import com.erpflow.sales.domain.SaleStatus;
import com.erpflow.sales.dto.*;
import com.erpflow.sales.repository.SaleRepository;
import com.erpflow.shared.exception.BusinessException;
import com.erpflow.shared.exception.ResourceNotFoundException;
import com.erpflow.shared.security.TenantContext;
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
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final InventoryService inventoryService;
    private final FinancialEntryRepository financialEntryRepository;
    private final AuditService auditService;

    public SaleService(SaleRepository saleRepository,
                       ProductRepository productRepository,
                       CustomerRepository customerRepository,
                       UserRepository userRepository,
                       CompanyRepository companyRepository,
                       InventoryService inventoryService,
                       FinancialEntryRepository financialEntryRepository,
                       AuditService auditService) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.inventoryService = inventoryService;
        this.financialEntryRepository = financialEntryRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<SaleResponse> search(SaleStatus status,
                                    Long customerId,
                                    String search,
                                    OffsetDateTime startDate,
                                    OffsetDateTime endDate,
                                    Pageable pageable) {
        Long companyId = TenantContext.getCurrentCompanyId();

        Specification<Sale> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("company").get("id"), companyId));

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (customerId != null) {
                predicates.add(cb.equal(root.get("customer").get("id"), customerId));
            }
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("saleNumber")), pattern),
                        cb.like(cb.lower(root.get("customer").get("name")), pattern)
                ));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("saleDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("saleDate"), endDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return saleRepository.findAll(spec, pageable)
                .map(SaleResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public SaleResponse findById(Long id) {
        Long companyId = TenantContext.getCurrentCompanyId();
        Sale sale = saleRepository.findByIdAndCompanyIdWithDetails(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Venda", id));
        return SaleResponse.fromEntity(sale);
    }

    @Transactional
    public SaleResponse create(SaleCreateRequest request) {
        Long companyId = TenantContext.getCurrentCompanyId();
        Long userId = TenantContext.getCurrentUserId();

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa", companyId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", userId));

        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findByIdAndCompanyId(request.getCustomerId(), companyId)
                    .orElseThrow(() -> new BusinessException("Cliente inválido ou não pertence a esta empresa."));
        }

        Sale sale = new Sale();
        sale.setCompany(company);
        sale.setUser(user);
        sale.setCustomer(customer);
        sale.setSaleDate(OffsetDateTime.now());
        sale.setPaymentMethod(request.getPaymentMethod());
        sale.setNotes(request.getNotes());
        sale.setStatus(SaleStatus.ORCAMENTO);

        // Gera número sequencial de venda: VD-YYYY-00000X
        long nextSeq = saleRepository.countByCompanyId(companyId) + 1;
        int currentYear = LocalDate.now().getYear();
        sale.setSaleNumber(String.format("VD-%d-%05d", currentYear, nextSeq));

        BigDecimal subtotalSum = BigDecimal.ZERO;

        for (SaleItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findByIdAndCompanyId(itemReq.getProductId(), companyId)
                    .orElseThrow(() -> new BusinessException("Produto #" + itemReq.getProductId() + " não encontrado."));

            if (!product.isActive()) {
                throw new BusinessException("O produto '" + product.getName() + "' está inativo para novas vendas.");
            }

            BigDecimal unitPrice = product.getSalePrice(); // Sempre recalcula do cadastro histórico
            BigDecimal itemDiscount = itemReq.getDiscount() != null ? itemReq.getDiscount() : BigDecimal.ZERO;
            BigDecimal itemSubtotal = (unitPrice.multiply(itemReq.getQuantity())).subtract(itemDiscount);

            if (itemSubtotal.compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessException("O desconto do item não pode ser superior ao seu valor total.");
            }

            SaleItem item = new SaleItem();
            item.setProduct(product);
            item.setQuantity(itemReq.getQuantity());
            item.setUnitPrice(unitPrice);
            item.setDiscount(itemDiscount);
            item.setSubtotal(itemSubtotal);

            sale.addItem(item);
            subtotalSum = subtotalSum.add(itemSubtotal);
        }

        BigDecimal generalDiscount = request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO;
        if (generalDiscount.compareTo(subtotalSum) > 0) {
            throw new BusinessException("O desconto geral da venda não pode ser maior que o subtotal dos itens.");
        }

        sale.setSubtotal(subtotalSum);
        sale.setDiscount(generalDiscount);
        sale.setTotalAmount(subtotalSum.subtract(generalDiscount));

        Sale savedSale = saleRepository.save(sale);

        // Se solicitado confirmação imediata (PDV direto)
        if (request.isConfirmImmediately()) {
            return confirm(savedSale.getId());
        }

        auditService.log("CRIAR_VENDA", "Sale", savedSale.getId().toString(), "Orçamento #" + savedSale.getSaleNumber() + " emitido");
        return SaleResponse.fromEntity(savedSale);
    }

    /**
     * Confirmação Atômica da Venda:
     * 1. Valida e baixa estoque dos produtos (com lock concorrente).
     * 2. Altera status da venda para CONFIRMADA.
     * 3. Registra lançamento financeiro a receber.
     */
    @Transactional
    public SaleResponse confirm(Long saleId) {
        Long companyId = TenantContext.getCurrentCompanyId();
        Long userId = TenantContext.getCurrentUserId();

        Sale sale = saleRepository.findByIdAndCompanyIdWithDetails(saleId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Venda", saleId));

        if (sale.getStatus() == SaleStatus.CONFIRMADA) {
            throw new BusinessException("Esta venda já foi confirmada anteriormente.");
        }
        if (sale.getStatus() == SaleStatus.CANCELADA) {
            throw new BusinessException("Não é possível confirmar uma venda cancelada.");
        }

        // 1. Movimentação e Validação de Estoque
        for (SaleItem item : sale.getItems()) {
            inventoryService.executeMovement(
                    companyId,
                    userId,
                    item.getProduct().getId(),
                    StockMovementType.SAIDA_VENDA,
                    item.getQuantity(),
                    item.getUnitPrice(),
                    "Saída operacional por Venda #" + sale.getSaleNumber(),
                    "Venda #" + sale.getSaleNumber()
            );
        }

        // 2. Confirmação do Status
        sale.setStatus(SaleStatus.CONFIRMADA);
        saleRepository.save(sale);

        // 3. Geração Automática do Título Financeiro a Receber
        boolean isImmediatePayment = sale.getPaymentMethod() == PaymentMethod.PIX ||
                                    sale.getPaymentMethod() == PaymentMethod.DINHEIRO ||
                                    sale.getPaymentMethod() == PaymentMethod.CARTAO_DEBITO;

        FinancialEntry receivable = new FinancialEntry();
        receivable.setCompany(sale.getCompany());
        receivable.setSale(sale);
        receivable.setCustomer(sale.getCustomer());
        receivable.setUser(sale.getUser());
        receivable.setDescription("Recebimento ref. Venda #" + sale.getSaleNumber());
        receivable.setType(FinancialType.RECEBER);
        receivable.setCategory("Vendas Comerciais");
        receivable.setAmount(sale.getTotalAmount());
        receivable.setDueDate(isImmediatePayment ? LocalDate.now() : LocalDate.now().plusDays(30));
        receivable.setPaymentMethod(sale.getPaymentMethod());

        if (isImmediatePayment) {
            receivable.setStatus(FinancialStatus.PAGO);
            receivable.setPaymentDate(LocalDate.now());
        } else {
            receivable.setStatus(FinancialStatus.PENDENTE);
        }

        financialEntryRepository.save(receivable);

        auditService.log("CONFIRMAR_VENDA", "Sale", sale.getId().toString(), "Venda #" + sale.getSaleNumber() + " confirmada com sucesso. Total: " + sale.getTotalAmount());

        return SaleResponse.fromEntity(sale);
    }

    /**
     * Cancelamento Atômico da Venda:
     * 1. Estorna estoque de todos os itens.
     * 2. Cancela os lançamentos financeiros vinculados.
     * 3. Altera status da venda para CANCELADA com justificativa.
     */
    @Transactional
    public SaleResponse cancel(Long saleId, CancelSaleRequest request) {
        Long companyId = TenantContext.getCurrentCompanyId();
        Long userId = TenantContext.getCurrentUserId();

        Sale sale = saleRepository.findByIdAndCompanyIdWithDetails(saleId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Venda", saleId));

        if (sale.getStatus() == SaleStatus.CANCELADA) {
            throw new BusinessException("Esta venda já foi cancelada anteriormente.");
        }

        // Se a venda havia sido confirmada, precisamos estornar estoque e cancelar contas a receber
        if (sale.getStatus() == SaleStatus.CONFIRMADA) {
            for (SaleItem item : sale.getItems()) {
                inventoryService.executeMovement(
                        companyId,
                        userId,
                        item.getProduct().getId(),
                        StockMovementType.ESTORNO_VENDA,
                        item.getQuantity(),
                        item.getUnitPrice(),
                        "Estorno por cancelamento de Venda #" + sale.getSaleNumber() + ": " + request.getReason(),
                        "Venda #" + sale.getSaleNumber()
                );
            }

            List<FinancialEntry> entries = financialEntryRepository.findByCompanyIdAndSaleId(companyId, sale.getId());
            for (FinancialEntry entry : entries) {
                entry.setStatus(FinancialStatus.CANCELADO);
                entry.setNotes("Cancelado automaticamente pelo cancelamento da Venda #" + sale.getSaleNumber());
                financialEntryRepository.save(entry);
            }
        }

        sale.setStatus(SaleStatus.CANCELADA);
        sale.setCancellationReason(request.getReason());
        Sale cancelledSale = saleRepository.save(sale);

        auditService.log("CANCELAR_VENDA", "Sale", cancelledSale.getId().toString(), "Venda #" + cancelledSale.getSaleNumber() + " cancelada. Motivo: " + request.getReason());

        return SaleResponse.fromEntity(cancelledSale);
    }
}
