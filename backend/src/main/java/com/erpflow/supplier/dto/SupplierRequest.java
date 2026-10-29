package com.erpflow.supplier.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SupplierRequest {

    @NotBlank(message = "A razão social é obrigatória")
    @Size(max = 150, message = "A razão social deve ter no máximo 150 caracteres")
    private String corporateName;

    @Size(max = 150, message = "O nome fantasia deve ter no máximo 150 caracteres")
    private String tradeName;

    @NotBlank(message = "O documento (CNPJ/CPF) é obrigatório")
    @Size(max = 20, message = "O documento deve ter no máximo 20 caracteres")
    private String document;

    private String email;
    private String phone;
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private String notes;
    private boolean active = true;

    public SupplierRequest() {}

    public String getCorporateName() { return corporateName; }
    public void setCorporateName(String corporateName) { this.corporateName = corporateName; }

    public String getTradeName() { return tradeName; }
    public void setTradeName(String tradeName) { this.tradeName = tradeName; }

    public String getDocument() { return document; }
    public void setDocument(String document) { this.document = document; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getZipCode() { return zipCode; }
    public void setZipCode(String zipCode) { this.zipCode = zipCode; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
