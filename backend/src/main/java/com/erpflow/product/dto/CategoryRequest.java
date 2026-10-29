package com.erpflow.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CategoryRequest {

    @NotBlank(message = "O nome da categoria é obrigatório")
    @Size(max = 80, message = "O nome deve ter no máximo 80 caracteres")
    private String name;

    private String description;
    private boolean active = true;

    public CategoryRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
