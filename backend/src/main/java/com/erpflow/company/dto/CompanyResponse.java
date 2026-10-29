package com.erpflow.company.dto;

import com.erpflow.company.domain.Company;
import java.time.OffsetDateTime;

public class CompanyResponse {

    private Long id;
    private String corporateName;
    private String tradeName;
    private String cnpj;
    private String email;
    private String phone;
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private boolean active;
    private OffsetDateTime createdAt;

    public CompanyResponse() {}

    public static CompanyResponse fromEntity(Company company) {
        CompanyResponse dto = new CompanyResponse();
        dto.setId(company.getId());
        dto.setCorporateName(company.getCorporateName());
        dto.setTradeName(company.getTradeName());
        dto.setCnpj(company.getCnpj());
        dto.setEmail(company.getEmail());
        dto.setPhone(company.getPhone());
        dto.setAddress(company.getAddress());
        dto.setCity(company.getCity());
        dto.setState(company.getState());
        dto.setZipCode(company.getZipCode());
        dto.setActive(company.isActive());
        dto.setCreatedAt(company.getCreatedAt());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCorporateName() { return corporateName; }
    public void setCorporateName(String corporateName) { this.corporateName = corporateName; }

    public String getTradeName() { return tradeName; }
    public void setTradeName(String tradeName) { this.tradeName = tradeName; }

    public String getCnpj() { return cnpj; }
    public void setCnpj(String cnpj) { this.cnpj = cnpj; }

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

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
