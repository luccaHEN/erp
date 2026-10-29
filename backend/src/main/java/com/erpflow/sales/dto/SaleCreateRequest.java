package com.erpflow.sales.dto;

import com.erpflow.financial.domain.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.util.List;

public class SaleCreateRequest {

    private Long customerId;

    @NotNull(message = "A forma de pagamento é obrigatória")
    private PaymentMethod paymentMethod;

    @PositiveOrZero(message = "O desconto total não pode ser negativo")
    private BigDecimal discount = BigDecimal.ZERO;

    private String notes;

    private boolean confirmImmediately = false;

    @NotEmpty(message = "A venda deve conter pelo menos um item")
    @Valid
    private List<SaleItemRequest> items;

    public SaleCreateRequest() {}

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public boolean isConfirmImmediately() { return confirmImmediately; }
    public void setConfirmImmediately(boolean confirmImmediately) { this.confirmImmediately = confirmImmediately; }

    public List<SaleItemRequest> getItems() { return items; }
    public void setItems(List<SaleItemRequest> items) { this.items = items; }
}
