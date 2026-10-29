package com.erpflow.product.service;

import com.erpflow.company.domain.Company;
import com.erpflow.company.repository.CompanyRepository;
import com.erpflow.product.domain.Category;
import com.erpflow.product.domain.Product;
import com.erpflow.product.dto.ProductRequest;
import com.erpflow.product.dto.ProductResponse;
import com.erpflow.product.repository.CategoryRepository;
import com.erpflow.product.repository.ProductRepository;
import com.erpflow.shared.exception.BusinessException;
import com.erpflow.shared.exception.ResourceNotFoundException;
import com.erpflow.shared.security.TenantContext;
import com.erpflow.supplier.domain.Supplier;
import com.erpflow.supplier.repository.SupplierRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import jakarta.persistence.criteria.Predicate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final CompanyRepository companyRepository;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          SupplierRepository supplierRepository,
                          CompanyRepository companyRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.companyRepository = companyRepository;
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> search(String search, Long categoryId, Boolean active, Boolean lowStock, Pageable pageable) {
        Long companyId = TenantContext.getCurrentCompanyId();

        Specification<Product> spec = (root, query, cb) -> {
            if (query != null && Long.class != query.getResultType() && long.class != query.getResultType()) {
                root.fetch("category", jakarta.persistence.criteria.JoinType.LEFT);
                root.fetch("supplier", jakarta.persistence.criteria.JoinType.LEFT);
                query.distinct(true);
            }

            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("company").get("id"), companyId));

            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("sku")), pattern)
                ));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }

            if (Boolean.TRUE.equals(lowStock)) {
                predicates.add(cb.lessThanOrEqualTo(root.get("currentStock"), root.get("minStock")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return productRepository.findAll(spec, pageable).map(ProductResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ProductResponse findById(Long id) {
        Long companyId = TenantContext.getCurrentCompanyId();
        Product product = productRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Produto", id));
        return ProductResponse.fromEntity(product);
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Long companyId = TenantContext.getCurrentCompanyId();
        String sku = request.getSku().trim();

        if (productRepository.existsByCompanyIdAndSku(companyId, sku)) {
            throw new BusinessException("Já existe um produto com o SKU '" + sku + "' nesta empresa.");
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa", companyId));

        Product product = new Product();
        product.setCompany(company);
        product.setCurrentStock(BigDecimal.ZERO); // Estoque inicial sempre gerenciado via movimentações
        applyData(product, request, companyId);

        return ProductResponse.fromEntity(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Long companyId = TenantContext.getCurrentCompanyId();
        Product product = productRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Produto", id));

        String newSku = request.getSku().trim();
        if (!newSku.equalsIgnoreCase(product.getSku()) && productRepository.existsByCompanyIdAndSku(companyId, newSku)) {
            throw new BusinessException("Já existe um produto com o SKU '" + newSku + "' nesta empresa.");
        }

        applyData(product, request, companyId);
        return ProductResponse.fromEntity(productRepository.save(product));
    }

    @Transactional
    public ProductResponse toggleStatus(Long id) {
        Long companyId = TenantContext.getCurrentCompanyId();
        Product product = productRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Produto", id));

        product.setActive(!product.isActive());
        return ProductResponse.fromEntity(productRepository.save(product));
    }

    private void applyData(Product product, ProductRequest request, Long companyId) {
        product.setName(request.getName().trim());
        product.setSku(request.getSku().trim());
        product.setDescription(request.getDescription());
        product.setUnit(request.getUnit().trim().toUpperCase());
        product.setCostPrice(request.getCostPrice());
        product.setSalePrice(request.getSalePrice());
        product.setMinStock(request.getMinStock());
        product.setActive(request.isActive());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findByIdAndCompanyId(request.getCategoryId(), companyId)
                    .orElseThrow(() -> new BusinessException("Categoria selecionada inválida ou não pertence à empresa."));
            product.setCategory(category);
        } else {
            product.setCategory(null);
        }

        if (request.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findByIdAndCompanyId(request.getSupplierId(), companyId)
                    .orElseThrow(() -> new BusinessException("Fornecedor selecionado inválido ou não pertence à empresa."));
            product.setSupplier(supplier);
        } else {
            product.setSupplier(null);
        }
    }
}
