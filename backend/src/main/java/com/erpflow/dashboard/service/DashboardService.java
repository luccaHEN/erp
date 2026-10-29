package com.erpflow.dashboard.service;

import com.erpflow.dashboard.dto.DashboardOverviewResponse;
import com.erpflow.dashboard.dto.SalesByPeriodDTO;
import com.erpflow.dashboard.dto.TopProductDTO;
import com.erpflow.financial.domain.FinancialStatus;
import com.erpflow.financial.domain.FinancialType;
import com.erpflow.financial.repository.FinancialEntryRepository;
import com.erpflow.product.repository.ProductRepository;
import com.erpflow.sales.domain.Sale;
import com.erpflow.sales.dto.SaleResponse;
import com.erpflow.sales.repository.SaleItemRepository;
import com.erpflow.sales.repository.SaleRepository;
import com.erpflow.shared.security.TenantContext;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final FinancialEntryRepository financialEntryRepository;
    private final ProductRepository productRepository;

    public DashboardService(SaleRepository saleRepository,
                            SaleItemRepository saleItemRepository,
                            FinancialEntryRepository financialEntryRepository,
                            ProductRepository productRepository) {
        this.saleRepository = saleRepository;
        this.saleItemRepository = saleItemRepository;
        this.financialEntryRepository = financialEntryRepository;
        this.productRepository = productRepository;
    }

    public DashboardOverviewResponse getOverview() {
        Long companyId = TenantContext.getCurrentCompanyId();

        // Primeiro dia do mês corrente às 00:00 UTC
        LocalDate firstDayOfMonth = LocalDate.now().withDayOfMonth(1);
        OffsetDateTime startOfMonth = firstDayOfMonth.atStartOfDay().atOffset(ZoneOffset.UTC);

        BigDecimal monthlyRevenue = saleRepository.sumConfirmedSalesByCompanySince(companyId, startOfMonth);
        long monthlySalesCount = saleRepository.countConfirmedSalesByCompanySince(companyId, startOfMonth);

        BigDecimal pendingReceivables = financialEntryRepository.sumAmountByCompanyIdAndTypeAndStatus(
                companyId, FinancialType.RECEBER, FinancialStatus.PENDENTE
        );
        BigDecimal pendingPayables = financialEntryRepository.sumAmountByCompanyIdAndTypeAndStatus(
                companyId, FinancialType.PAGAR, FinancialStatus.PENDENTE
        );

        long lowStockCount = productRepository.countLowStockByCompanyId(companyId);

        return new DashboardOverviewResponse(
                monthlyRevenue != null ? monthlyRevenue : BigDecimal.ZERO,
                monthlySalesCount,
                pendingReceivables != null ? pendingReceivables : BigDecimal.ZERO,
                pendingPayables != null ? pendingPayables : BigDecimal.ZERO,
                lowStockCount
        );
    }

    public List<SalesByPeriodDTO> getSalesChart(int days) {
        Long companyId = TenantContext.getCurrentCompanyId();
        OffsetDateTime since = LocalDate.now().minusDays(days).atStartOfDay().atOffset(ZoneOffset.UTC);

        List<Sale> sales = saleRepository.findConfirmedSalesSince(companyId, since);

        // Agrupa por dia
        Map<LocalDate, List<Sale>> groupedByDay = sales.stream()
                .collect(Collectors.groupingBy(s -> s.getSaleDate().toLocalDate()));

        List<SalesByPeriodDTO> result = new ArrayList<>();
        for (int i = days; i >= 0; i--) {
            LocalDate day = LocalDate.now().minusDays(i);
            List<Sale> daySales = groupedByDay.getOrDefault(day, Collections.emptyList());

            BigDecimal total = daySales.stream()
                    .map(Sale::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            result.add(new SalesByPeriodDTO(day, total, (long) daySales.size()));
        }

        return result;
    }

    public List<TopProductDTO> getTopProducts(int limit) {
        Long companyId = TenantContext.getCurrentCompanyId();
        return saleItemRepository.findTopSellingProducts(companyId, PageRequest.of(0, limit));
    }
}
