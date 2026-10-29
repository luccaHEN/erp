package com.erpflow.financial.dto;

import com.erpflow.financial.domain.FinancialEntry;
import com.erpflow.financial.domain.FinancialStatus;
import com.erpflow.financial.domain.FinancialType;
import com.erpflow.financial.domain.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class FinancialEntryResponse {

    private Long id;
    private Long saleId;
    private Long customerId;
    private String customerName;
    private Long supplierId;
    private String supplierName;
    private String description;
    private FinancialType type;
    private String category;
    private BigDecimal amount;
    private LocalDate dueDate;
    private LocalDate paymentDate;
    private FinancialStatus status;
    private PaymentMethod paymentMethod;
    private boolean overdue;
    private String notes;
    private OffsetDateTime createdAt;

    public FinancialEntryResponse() {}

    public static FinancialEntryResponse fromEntity(FinancialEntry entry) {
        FinancialEntryResponse dto = new FinancialEntryResponse();
        dto.setId(entry.getId());
        dto.setDescription(entry.getDescription());
        dto.setType(entry.getType());
        dto.setCategory(entry.getCategory());
        dto.setAmount(entry.getAmount());
        dto.setDueDate(entry.getDueDate());
        dto.setPaymentDate(entry.getPaymentDate());
        dto.setStatus(entry.getStatus());
        dto.setPaymentMethod(entry.getPaymentMethod());
        dto.setNotes(entry.getNotes());
        dto.setCreatedAt(entry.getCreatedAt());

        if (entry.getSale() != null) {
            dto.setSaleId(entry.getSale().getId());
        }

        if (entry.getCustomer() != null) {
            dto.setCustomerId(entry.getCustomer().getId());
            dto.setCustomerName(entry.getCustomer().getName());
        }

        if (entry.getSupplier() != null) {
            dto.setSupplierId(entry.getSupplier().getId());
            dto.setSupplierName(entry.getSupplier().getTradeName() != null ?
                    entry.getSupplier().getTradeName() : entry.getSupplier().getCorporateName());
        }

        boolean isOverdue = entry.getStatus() == FinancialStatus.PENDENTE &&
                            entry.getDueDate().isBefore(LocalDate.now());
        dto.setOverdue(isOverdue);

        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSaleId() { return saleId; }
    public void setSaleId(Long saleId) { this.saleId = saleId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }

    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public FinancialType getType() { return type; }
    public void setType(FinancialType type) { this.type = type; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public LocalDate getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }

    public FinancialStatus getStatus() { return status; }
    public void setStatus(FinancialStatus status) { this.status = status; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public boolean isOverdue() { return overdue; }
    public void setOverdue(boolean overdue) { this.overdue = overdue; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
