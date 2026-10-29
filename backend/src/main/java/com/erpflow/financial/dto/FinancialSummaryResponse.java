package com.erpflow.financial.dto;

import java.math.BigDecimal;

public class FinancialSummaryResponse {

    private BigDecimal pendingReceivables;
    private BigDecimal pendingPayables;
    private BigDecimal overdueReceivables;
    private BigDecimal overduePayables;
    private BigDecimal netProjectedCashFlow;

    public FinancialSummaryResponse() {}

    public FinancialSummaryResponse(BigDecimal pendingReceivables,
                                    BigDecimal pendingPayables,
                                    BigDecimal overdueReceivables,
                                    BigDecimal overduePayables) {
        this.pendingReceivables = pendingReceivables != null ? pendingReceivables : BigDecimal.ZERO;
        this.pendingPayables = pendingPayables != null ? pendingPayables : BigDecimal.ZERO;
        this.overdueReceivables = overdueReceivables != null ? overdueReceivables : BigDecimal.ZERO;
        this.overduePayables = overduePayables != null ? overduePayables : BigDecimal.ZERO;
        this.netProjectedCashFlow = this.pendingReceivables.subtract(this.pendingPayables);
    }

    public BigDecimal getPendingReceivables() { return pendingReceivables; }
    public void setPendingReceivables(BigDecimal pendingReceivables) { this.pendingReceivables = pendingReceivables; }

    public BigDecimal getPendingPayables() { return pendingPayables; }
    public void setPendingPayables(BigDecimal pendingPayables) { this.pendingPayables = pendingPayables; }

    public BigDecimal getOverdueReceivables() { return overdueReceivables; }
    public void setOverdueReceivables(BigDecimal overdueReceivables) { this.overdueReceivables = overdueReceivables; }

    public BigDecimal getOverduePayables() { return overduePayables; }
    public void setOverduePayables(BigDecimal overduePayables) { this.overduePayables = overduePayables; }

    public BigDecimal getNetProjectedCashFlow() { return netProjectedCashFlow; }
    public void setNetProjectedCashFlow(BigDecimal netProjectedCashFlow) { this.netProjectedCashFlow = netProjectedCashFlow; }
}
