-- ========================================================
-- ERP Flow - V1__init_schema.sql
-- Modelagem Relacional Completa com Suporte Multitenancy
-- ========================================================

-- 1. EMPRESAS (Companies)
CREATE TABLE companies (
    id BIGSERIAL PRIMARY KEY,
    corporate_name VARCHAR(150) NOT NULL,
    trade_name VARCHAR(150) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    email VARCHAR(120),
    phone VARCHAR(20),
    address VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. USUÁRIOS (Users)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'OPERADOR')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_email UNIQUE (email)
);
CREATE INDEX idx_users_company ON users(company_id);

-- 3. CATEGORIAS DE PRODUTOS (Categories)
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    name VARCHAR(80) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_categories_company_name UNIQUE (company_id, name)
);
CREATE INDEX idx_categories_company ON categories(company_id);

-- 4. FORNECEDORES (Suppliers)
CREATE TABLE suppliers (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    corporate_name VARCHAR(150) NOT NULL,
    trade_name VARCHAR(150),
    document VARCHAR(20) NOT NULL, -- CNPJ ou CPF
    email VARCHAR(120),
    phone VARCHAR(20),
    address VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_suppliers_company_document UNIQUE (company_id, document)
);
CREATE INDEX idx_suppliers_company ON suppliers(company_id);

-- 5. CLIENTES (Customers)
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    document VARCHAR(20), -- CPF ou CNPJ (opcional mas único se preenchido)
    email VARCHAR(120),
    phone VARCHAR(20),
    address VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_customers_company ON customers(company_id);
CREATE INDEX idx_customers_company_name ON customers(company_id, name);

-- 6. PRODUTOS (Products)
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(60) NOT NULL,
    description TEXT,
    unit VARCHAR(10) NOT NULL DEFAULT 'UN',
    cost_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    current_stock NUMERIC(15, 3) NOT NULL DEFAULT 0.000,
    min_stock NUMERIC(15, 3) NOT NULL DEFAULT 0.000,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_products_company_sku UNIQUE (company_id, sku)
);
CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_products_company_sku ON products(company_id, sku);
CREATE INDEX idx_products_company_name ON products(company_id, name);

-- 7. MOVIMENTAÇÕES DE ESTOQUE (Stock Movements - Ledger Imutável)
CREATE TABLE stock_movements (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    type VARCHAR(30) NOT NULL CHECK (type IN ('ENTRADA', 'SAIDA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'SAIDA_VENDA', 'ESTORNO_VENDA')),
    quantity NUMERIC(15, 3) NOT NULL,
    balance_after NUMERIC(15, 3) NOT NULL,
    unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    reason TEXT,
    source_document VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_stock_movements_company ON stock_movements(company_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_created ON stock_movements(company_id, created_at);

-- 8. VENDAS (Sales)
CREATE TABLE sales (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    sale_number VARCHAR(30) NOT NULL,
    customer_id BIGINT REFERENCES customers(id) ON DELETE RESTRICT,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    sale_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(30) NOT NULL, -- PIX, DINHEIRO, CARTAO_CREDITO, CARTAO_DEBITO, BOLETO, A_PRAZO
    status VARCHAR(20) NOT NULL DEFAULT 'ORCAMENTO' CHECK (status IN ('ORCAMENTO', 'CONFIRMADA', 'CANCELADA')),
    cancellation_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_sales_company_number UNIQUE (company_id, sale_number)
);
CREATE INDEX idx_sales_company ON sales(company_id);
CREATE INDEX idx_sales_company_status ON sales(company_id, status);
CREATE INDEX idx_sales_company_date ON sales(company_id, sale_date);

-- 9. ITENS DE VENDA (Sale Items)
CREATE TABLE sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(15, 3) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    discount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(15, 2) NOT NULL
);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

-- 10. LANÇAMENTOS FINANCEIROS (Financial Entries - Contas a Pagar / Receber)
CREATE TABLE financial_entries (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    sale_id BIGINT REFERENCES sales(id) ON DELETE SET NULL,
    customer_id BIGINT REFERENCES customers(id) ON DELETE RESTRICT,
    supplier_id BIGINT REFERENCES suppliers(id) ON DELETE RESTRICT,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    description VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('RECEBER', 'PAGAR')),
    category VARCHAR(60) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PAGO', 'CANCELADO')),
    payment_method VARCHAR(30),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_financial_entries_company ON financial_entries(company_id);
CREATE INDEX idx_financial_entries_status ON financial_entries(company_id, status);
CREATE INDEX idx_financial_entries_due ON financial_entries(company_id, due_date);
CREATE INDEX idx_financial_entries_type ON financial_entries(company_id, type);

-- 11. AUDITORIA (Audit Logs)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(120),
    action VARCHAR(60) NOT NULL,
    entity_name VARCHAR(60) NOT NULL,
    entity_id VARCHAR(60),
    ip_address VARCHAR(45),
    details_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(company_id, created_at);
