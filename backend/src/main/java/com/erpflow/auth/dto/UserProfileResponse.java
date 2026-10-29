package com.erpflow.auth.dto;

import com.erpflow.user.domain.Role;

public class UserProfileResponse {

    private Long id;
    private String name;
    private String email;
    private Role role;
    private Long companyId;
    private String companyName;

    public UserProfileResponse() {}

    public UserProfileResponse(Long id, String name, String email, Role role, Long companyId, String companyName) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.companyId = companyId;
        this.companyName = companyName;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
}
