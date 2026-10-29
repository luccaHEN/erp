package com.erpflow.financial.dto;

import com.erpflow.financial.domain.FinancialStatus;
import com.erpflow.financial.domain.FinancialType;
import com.erpflow.financial.domain.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class FinancialEntryRequest {

    @NotBlank(message = "A descrição é obrigatória")
    @Size(max = 200, message = "A descrição deve ter no máximo 200 caracteres")
    private String description;

    @NotNull(message = "O tipo (RECEBER ou PAGAR) é obrigatório")
    private FinancialType type;

    @NotBlank(message = "A categoria do lançamento é obrigatória")
    @Size(max = 60, message = "A categoria deve ter no máximo 60 caracteres")
    private String category;

    @NotNull(message = "O valor é obrigatório")
    @Positive(message = "O valor deve ser maior que zero")
    private BigDecimal amount;

    @NotNull(message = "A data de vencimento é obrigatória")
    private LocalDate dueDate;

    private LocalDate paymentDate;
    private FinancialStatus status = FinancialStatus.PENDENTE;
    private PaymentMethod paymentMethod;
    private Long customerId;
    private Long supplierId;
    private String notes;

    public FinancialEntryRequest() {}

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

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
