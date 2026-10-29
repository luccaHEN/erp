package com.erpflow.sales.dto;

import com.erpflow.financial.domain.PaymentMethod;
import com.erpflow.sales.domain.Sale;
import com.erpflow.sales.domain.SaleStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class SaleResponse {

    private Long id;
    private String saleNumber;
    private Long customerId;
    private String customerName;
    private String customerDocument;
    private Long userId;
    private String userName;
    private OffsetDateTime saleDate;
    private BigDecimal subtotal;
    private BigDecimal discount;
    private BigDecimal totalAmount;
    private PaymentMethod paymentMethod;
    private SaleStatus status;
    private String cancellationReason;
    private String notes;
    private List<SaleItemResponse> items;
    private OffsetDateTime createdAt;

    public SaleResponse() {}

    public static SaleResponse fromEntity(Sale sale) {
        SaleResponse dto = new SaleResponse();
        dto.setId(sale.getId());
        dto.setSaleNumber(sale.getSaleNumber());
        dto.setUserId(sale.getUser().getId());
        dto.setUserName(sale.getUser().getName());
        dto.setSaleDate(sale.getSaleDate());
        dto.setSubtotal(sale.getSubtotal());
        dto.setDiscount(sale.getDiscount());
        dto.setTotalAmount(sale.getTotalAmount());
        dto.setPaymentMethod(sale.getPaymentMethod());
        dto.setStatus(sale.getStatus());
        dto.setCancellationReason(sale.getCancellationReason());
        dto.setNotes(sale.getNotes());
        dto.setCreatedAt(sale.getCreatedAt());

        if (sale.getCustomer() != null) {
            dto.setCustomerId(sale.getCustomer().getId());
            dto.setCustomerName(sale.getCustomer().getName());
            dto.setCustomerDocument(sale.getCustomer().getDocument());
        }

        if (sale.getItems() != null) {
            dto.setItems(sale.getItems().stream()
                    .map(SaleItemResponse::fromEntity)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSaleNumber() { return saleNumber; }
    public void setSaleNumber(String saleNumber) { this.saleNumber = saleNumber; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerDocument() { return customerDocument; }
    public void setCustomerDocument(String customerDocument) { this.customerDocument = customerDocument; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public OffsetDateTime getSaleDate() { return saleDate; }
    public void setSaleDate(OffsetDateTime saleDate) { this.saleDate = saleDate; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public SaleStatus getStatus() { return status; }
    public void setStatus(SaleStatus status) { this.status = status; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<SaleItemResponse> getItems() { return items; }
    public void setItems(List<SaleItemResponse> items) { this.items = items; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
