package com.erpflow.supplier.dto;

import com.erpflow.supplier.domain.Supplier;
import java.time.OffsetDateTime;

public class SupplierResponse {

    private Long id;
    private String corporateName;
    private String tradeName;
    private String document;
    private String email;
    private String phone;
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private String notes;
    private boolean active;
    private OffsetDateTime createdAt;

    public SupplierResponse() {}

    public static SupplierResponse fromEntity(Supplier supplier) {
        SupplierResponse dto = new SupplierResponse();
        dto.setId(supplier.getId());
        dto.setCorporateName(supplier.getCorporateName());
        dto.setTradeName(supplier.getTradeName());
        dto.setDocument(supplier.getDocument());
        dto.setEmail(supplier.getEmail());
        dto.setPhone(supplier.getPhone());
        dto.setAddress(supplier.getAddress());
        dto.setCity(supplier.getCity());
        dto.setState(supplier.getState());
        dto.setZipCode(supplier.getZipCode());
        dto.setNotes(supplier.getNotes());
        dto.setActive(supplier.isActive());
        dto.setCreatedAt(supplier.getCreatedAt());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
