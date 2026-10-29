package com.erpflow.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class ProductRequest {

    @NotBlank(message = "O nome do produto é obrigatório")
    @Size(max = 150, message = "O nome deve ter no máximo 150 caracteres")
    private String name;

    @NotBlank(message = "O SKU ou código interno é obrigatório")
    @Size(max = 60, message = "O SKU deve ter no máximo 60 caracteres")
    private String sku;

    private String description;

    @NotBlank(message = "A unidade de medida é obrigatória")
    @Size(max = 10, message = "A unidade deve ter no máximo 10 caracteres")
    private String unit = "UN";

    private Long categoryId;
    private Long supplierId;

    @NotNull(message = "O preço de custo é obrigatório")
    @PositiveOrZero(message = "O preço de custo não pode ser negativo")
    private BigDecimal costPrice;

    @NotNull(message = "O preço de venda é obrigatório")
    @PositiveOrZero(message = "O preço de venda não pode ser negativo")
    private BigDecimal salePrice;

    @NotNull(message = "O estoque mínimo é obrigatório")
    @PositiveOrZero(message = "O estoque mínimo não pode ser negativo")
    private BigDecimal minStock = BigDecimal.ZERO;

    private boolean active = true;

    public ProductRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }

    public BigDecimal getCostPrice() { return costPrice; }
    public void setCostPrice(BigDecimal costPrice) { this.costPrice = costPrice; }

    public BigDecimal getSalePrice() { return salePrice; }
    public void setSalePrice(BigDecimal salePrice) { this.salePrice = salePrice; }

    public BigDecimal getMinStock() { return minStock; }
    public void setMinStock(BigDecimal minStock) { this.minStock = minStock; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
