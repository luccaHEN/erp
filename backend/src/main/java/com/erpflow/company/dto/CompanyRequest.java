package com.erpflow.company.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CompanyRequest {

    @NotBlank(message = "A razão social é obrigatória")
    @Size(max = 150, message = "A razão social deve ter no máximo 150 caracteres")
    private String corporateName;

    @NotBlank(message = "O nome fantasia é obrigatório")
    @Size(max = 150, message = "O nome fantasia deve ter no máximo 150 caracteres")
    private String tradeName;

    @NotBlank(message = "O CNPJ é obrigatório")
    @Size(max = 18, message = "O CNPJ deve ter no máximo 18 caracteres")
    private String cnpj;

    private String email;
    private String phone;
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private boolean active = true;

    public CompanyRequest() {}

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
}
