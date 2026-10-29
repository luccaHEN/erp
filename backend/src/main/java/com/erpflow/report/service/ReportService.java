package com.erpflow.report.service;

import com.erpflow.financial.domain.FinancialEntry;
import com.erpflow.financial.domain.FinancialStatus;
import com.erpflow.financial.domain.FinancialType;
import com.erpflow.financial.repository.FinancialEntryRepository;
import com.erpflow.product.domain.Product;
import com.erpflow.product.repository.ProductRepository;
import com.erpflow.report.dto.FinancialReportItemDTO;
import com.erpflow.report.dto.InventoryReportItemDTO;
import com.erpflow.report.dto.SalesReportItemDTO;
import com.erpflow.sales.domain.Sale;
import com.erpflow.sales.domain.SaleStatus;
import com.erpflow.sales.repository.SaleRepository;
import com.erpflow.shared.security.TenantContext;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final FinancialEntryRepository financialEntryRepository;

    public ReportService(SaleRepository saleRepository,
                         ProductRepository productRepository,
                         FinancialEntryRepository financialEntryRepository) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
        this.financialEntryRepository = financialEntryRepository;
    }

    public List<SalesReportItemDTO> getSalesReport(SaleStatus status, OffsetDateTime startDate, OffsetDateTime endDate) {
        Long companyId = TenantContext.getCurrentCompanyId();

        Specification<Sale> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(cb.equal(root.get("company").get("id"), companyId));
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("saleDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("saleDate"), endDate));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return saleRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "saleDate"))
                .stream()
                .map(s -> new SalesReportItemDTO(
                        s.getId(),
                        s.getSaleNumber(),
                        s.getSaleDate(),
                        s.getCustomer() != null ? s.getCustomer().getName() : "Consumidor Final",
                        s.getUser() != null ? s.getUser().getName() : "-",
                        s.getPaymentMethod() != null ? s.getPaymentMethod().name() : "-",
                        s.getStatus().name(),
                        s.getSubtotal(),
                        s.getDiscount(),
                        s.getTotalAmount()
                ))
                .toList();
    }

    public byte[] exportSalesToCsv(SaleStatus status, OffsetDateTime startDate, OffsetDateTime endDate) {
        List<SalesReportItemDTO> items = getSalesReport(status, startDate, endDate);
        StringBuilder sb = new StringBuilder();
        // BOM UTF-8 para Excel reconhecer caracteres especiais perfeitamente
        sb.append('\ufeff');
        sb.append("Número;Data/Hora;Cliente;Vendedor;Forma Pagamento;Status;Subtotal;Desconto;Valor Total\n");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        for (SalesReportItemDTO item : items) {
            sb.append(escapeCsv(item.saleNumber())).append(";")
              .append(escapeCsv(item.saleDate().format(dtf))).append(";")
              .append(escapeCsv(item.customerName())).append(";")
              .append(escapeCsv(item.userName())).append(";")
              .append(escapeCsv(item.paymentMethod())).append(";")
              .append(escapeCsv(item.status())).append(";")
              .append(item.subtotal()).append(";")
              .append(item.discount()).append(";")
              .append(item.totalAmount()).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public List<InventoryReportItemDTO> getInventoryReport(Boolean lowStockOnly) {
        Long companyId = TenantContext.getCurrentCompanyId();

        Specification<Product> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(cb.equal(root.get("company").get("id"), companyId));
            predicates.add(cb.isTrue(root.get("active")));

            if (Boolean.TRUE.equals(lowStockOnly)) {
                predicates.add(cb.lessThanOrEqualTo(root.get("currentStock"), root.get("minStock")));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return productRepository.findAll(spec, Sort.by(Sort.Direction.ASC, "name"))
                .stream().map(p -> {
            BigDecimal cost = p.getCostPrice() != null ? p.getCostPrice() : BigDecimal.ZERO;
            BigDecimal sale = p.getSalePrice() != null ? p.getSalePrice() : BigDecimal.ZERO;
            BigDecimal stock = p.getCurrentStock() != null ? p.getCurrentStock() : BigDecimal.ZERO;
            BigDecimal minStock = p.getMinStock() != null ? p.getMinStock() : BigDecimal.ZERO;

            return new InventoryReportItemDTO(
                    p.getId(),
                    p.getName(),
                    p.getSku(),
                    p.getCategory() != null ? p.getCategory().getName() : "-",
                    p.getUnit(),
                    stock,
                    minStock,
                    cost,
                    sale,
                    cost.multiply(stock),
                    sale.multiply(stock),
                    p.isLowStock()
            );
        }).toList();
    }

    public byte[] exportInventoryToCsv(Boolean lowStockOnly) {
        List<InventoryReportItemDTO> items = getInventoryReport(lowStockOnly);
        StringBuilder sb = new StringBuilder();
        sb.append('\ufeff');
        sb.append("ID;Produto;SKU;Categoria;Unidade;Estoque Atual;Estoque Mínimo;Preço Custo;Preço Venda;Valor Total Custo;Valor Total Venda;Estoque Baixo\n");

        for (InventoryReportItemDTO item : items) {
            sb.append(item.productId()).append(";")
              .append(escapeCsv(item.name())).append(";")
              .append(escapeCsv(item.sku())).append(";")
              .append(escapeCsv(item.categoryName())).append(";")
              .append(escapeCsv(item.unit())).append(";")
              .append(item.currentStock()).append(";")
              .append(item.minStock()).append(";")
              .append(item.costPrice()).append(";")
              .append(item.salePrice()).append(";")
              .append(item.totalCostValue()).append(";")
              .append(item.totalSaleValue()).append(";")
              .append(item.lowStock() ? "SIM" : "NÃO").append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public List<FinancialReportItemDTO> getFinancialReport(FinancialType type, FinancialStatus status, LocalDate startDate, LocalDate endDate) {
        Long companyId = TenantContext.getCurrentCompanyId();

        Specification<FinancialEntry> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(cb.equal(root.get("company").get("id"), companyId));
            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("dueDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("dueDate"), endDate));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return financialEntryRepository.findAll(spec, Sort.by(Sort.Direction.ASC, "dueDate"))
                .stream()
                .map(f -> {
                    String entity = "-";
                    if (f.getCustomer() != null) entity = f.getCustomer().getName();
                    else if (f.getSupplier() != null) entity = f.getSupplier().getCorporateName();

                    return new FinancialReportItemDTO(
                            f.getId(),
                            f.getDescription(),
                            f.getType().name(),
                            f.getCategory(),
                            entity,
                            f.getAmount(),
                            f.getDueDate(),
                            f.getPaymentDate(),
                            f.getStatus().name(),
                            f.getPaymentMethod() != null ? f.getPaymentMethod().name() : "-"
                    );
                })
                .toList();
    }

    public byte[] exportFinancialToCsv(FinancialType type, FinancialStatus status, LocalDate startDate, LocalDate endDate) {
        List<FinancialReportItemDTO> items = getFinancialReport(type, status, startDate, endDate);
        StringBuilder sb = new StringBuilder();
        sb.append('\ufeff');
        sb.append("ID;Tipo;Descrição;Categoria;Cliente/Fornecedor;Valor;Vencimento;Pagamento;Status;Meio de Pagamento\n");

        DateTimeFormatter df = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        for (FinancialReportItemDTO item : items) {
            sb.append(item.id()).append(";")
              .append(escapeCsv(item.type())).append(";")
              .append(escapeCsv(item.description())).append(";")
              .append(escapeCsv(item.category())).append(";")
              .append(escapeCsv(item.relatedEntity())).append(";")
              .append(item.amount()).append(";")
              .append(item.dueDate() != null ? item.dueDate().format(df) : "").append(";")
              .append(item.paymentDate() != null ? item.paymentDate().format(df) : "").append(";")
              .append(escapeCsv(item.status())).append(";")
              .append(escapeCsv(item.paymentMethod())).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Sanitização rigorosa contra CSV Formula Injection / DDE attacks no Excel e LibreOffice.
     */
    private String escapeCsv(String value) {
        if (value == null) return "";
        String s = value.trim();
        if (s.startsWith("=") || s.startsWith("+") || s.startsWith("-") || s.startsWith("@") || s.startsWith("\t") || s.startsWith("\r")) {
            s = "'" + s;
        }
        if (s.contains(";") || s.contains("\"") || s.contains("\n") || s.contains("\r")) {
            s = "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }
}
