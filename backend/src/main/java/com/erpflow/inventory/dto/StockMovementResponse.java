package com.erpflow.inventory.dto;

import com.erpflow.inventory.domain.StockMovement;
import com.erpflow.inventory.domain.StockMovementType;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class StockMovementResponse {

    private Long id;
    private Long productId;
    private String productName;
    private String productSku;
    private String productUnit;
    private Long userId;
    private String userName;
    private StockMovementType type;
    private BigDecimal quantity;
    private BigDecimal balanceAfter;
    private BigDecimal unitCost;
    private String reason;
    private String sourceDocument;
    private OffsetDateTime createdAt;

    public StockMovementResponse() {}

    public static StockMovementResponse fromEntity(StockMovement movement) {
        StockMovementResponse dto = new StockMovementResponse();
        dto.setId(movement.getId());
        dto.setProductId(movement.getProduct().getId());
        dto.setProductName(movement.getProduct().getName());
        dto.setProductSku(movement.getProduct().getSku());
        dto.setProductUnit(movement.getProduct().getUnit());
        dto.setUserId(movement.getUser().getId());
        dto.setUserName(movement.getUser().getName());
        dto.setType(movement.getType());
        dto.setQuantity(movement.getQuantity());
        dto.setBalanceAfter(movement.getBalanceAfter());
        dto.setUnitCost(movement.getUnitCost());
        dto.setReason(movement.getReason());
        dto.setSourceDocument(movement.getSourceDocument());
        dto.setCreatedAt(movement.getCreatedAt());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getProductSku() { return productSku; }
    public void setProductSku(String productSku) { this.productSku = productSku; }

    public String getProductUnit() { return productUnit; }
    public void setProductUnit(String productUnit) { this.productUnit = productUnit; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public StockMovementType getType() { return type; }
    public void setType(StockMovementType type) { this.type = type; }

    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }

    public BigDecimal getBalanceAfter() { return balanceAfter; }
    public void setBalanceAfter(BigDecimal balanceAfter) { this.balanceAfter = balanceAfter; }

    public BigDecimal getUnitCost() { return unitCost; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getSourceDocument() { return sourceDocument; }
    public void setSourceDocument(String sourceDocument) { this.sourceDocument = sourceDocument; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
