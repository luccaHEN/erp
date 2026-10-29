package com.erpflow.inventory.dto;

import com.erpflow.inventory.domain.StockMovementType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public class StockMovementRequest {

    @NotNull(message = "O produto é obrigatório")
    private Long productId;

    @NotNull(message = "O tipo de movimentação é obrigatório")
    private StockMovementType type;

    @NotNull(message = "A quantidade é obrigatória")
    @Positive(message = "A quantidade deve ser maior que zero")
    private BigDecimal quantity;

    private BigDecimal unitCost;
    private String reason;
    private String sourceDocument;

    public StockMovementRequest() {}

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public StockMovementType getType() { return type; }
    public void setType(StockMovementType type) { this.type = type; }

    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }

    public BigDecimal getUnitCost() { return unitCost; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getSourceDocument() { return sourceDocument; }
    public void setSourceDocument(String sourceDocument) { this.sourceDocument = sourceDocument; }
}
