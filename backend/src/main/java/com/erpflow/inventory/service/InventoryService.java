package com.erpflow.inventory.service;

import com.erpflow.company.domain.Company;
import com.erpflow.company.repository.CompanyRepository;
import com.erpflow.inventory.domain.StockMovement;
import com.erpflow.inventory.domain.StockMovementType;
import com.erpflow.inventory.dto.StockMovementRequest;
import com.erpflow.inventory.dto.StockMovementResponse;
import com.erpflow.inventory.repository.StockMovementRepository;
import com.erpflow.product.domain.Product;
import com.erpflow.product.repository.ProductRepository;
import com.erpflow.shared.exception.BusinessException;
import com.erpflow.shared.exception.ResourceNotFoundException;
import com.erpflow.shared.security.TenantContext;
import com.erpflow.user.domain.User;
import com.erpflow.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class InventoryService {

    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;

    public InventoryService(StockMovementRepository stockMovementRepository,
                            ProductRepository productRepository,
                            UserRepository userRepository,
                            CompanyRepository companyRepository) {
        this.stockMovementRepository = stockMovementRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
    }

    @Transactional(readOnly = true)
    public Page<StockMovementResponse> search(Long productId, StockMovementType type, Pageable pageable) {
        Long companyId = TenantContext.getCurrentCompanyId();
        return stockMovementRepository.search(companyId, productId, type, pageable)
                .map(StockMovementResponse::fromEntity);
    }

    @Transactional
    public StockMovementResponse registerMovement(StockMovementRequest request) {
        Long companyId = TenantContext.getCurrentCompanyId();
        Long userId = TenantContext.getCurrentUserId();

        return executeMovement(
                companyId,
                userId,
                request.getProductId(),
                request.getType(),
                request.getQuantity(),
                request.getUnitCost(),
                request.getReason(),
                request.getSourceDocument()
        );
    }

    /**
     * Método transacional central para registro de movimentações com bloqueio pessimista
     */
    @Transactional
    public StockMovementResponse executeMovement(Long companyId,
                                                Long userId,
                                                Long productId,
                                                StockMovementType type,
                                                BigDecimal quantity,
                                                BigDecimal unitCost,
                                                String reason,
                                                String sourceDocument) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("A quantidade movimentada deve ser estritamente positiva.");
        }

        // Lock pessimista para garantir consistência em concorrência
        Product product = productRepository.findByIdAndCompanyIdWithLock(productId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Produto", productId));

        if (!product.isActive()) {
            throw new BusinessException("Não é possível movimentar estoque de um produto inativo.");
        }

        BigDecimal currentStock = product.getCurrentStock();
        BigDecimal newStock;

        switch (type) {
            case ENTRADA, AJUSTE_POSITIVO, ESTORNO_VENDA -> {
                newStock = currentStock.add(quantity);
                if (unitCost != null && unitCost.compareTo(BigDecimal.ZERO) > 0 && type == StockMovementType.ENTRADA) {
                    product.setCostPrice(unitCost);
                }
            }
            case SAIDA, AJUSTE_NEGATIVO, SAIDA_VENDA -> {
                if (currentStock.compareTo(quantity) < 0) {
                    throw new BusinessException(String.format(
                            "Estoque insuficiente para o produto '%s'. Saldo disponível: %s %s, Quantidade solicitada: %s %s.",
                            product.getName(), currentStock, product.getUnit(), quantity, product.getUnit()
                    ));
                }
                newStock = currentStock.subtract(quantity);
            }
            default -> throw new BusinessException("Tipo de movimentação inválido: " + type);
        }

        product.setCurrentStock(newStock);
        productRepository.save(product);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", userId));

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa", companyId));

        StockMovement movement = new StockMovement();
        movement.setCompany(company);
        movement.setProduct(product);
        movement.setUser(user);
        movement.setType(type);
        movement.setQuantity(quantity);
        movement.setBalanceAfter(newStock);
        movement.setUnitCost(unitCost != null ? unitCost : product.getCostPrice());
        movement.setReason(reason);
        movement.setSourceDocument(sourceDocument);

        return StockMovementResponse.fromEntity(stockMovementRepository.save(movement));
    }
}
