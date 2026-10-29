package com.erpflow.sales.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CancelSaleRequest {

    @NotBlank(message = "A justificativa de cancelamento é obrigatória")
    @Size(min = 5, max = 500, message = "A justificativa deve ter entre 5 e 500 caracteres")
    private String reason;

    public CancelSaleRequest() {}

    public CancelSaleRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
