-- ========================================================
-- ERP Flow - V2__seed_initial_data.sql
-- Dados Iniciais para Demonstração e Desenvolvimento
-- ========================================================

-- 1. EMPRESA PADRÃO
INSERT INTO companies (id, corporate_name, trade_name, cnpj, email, phone, address, city, state, zip_code, active, created_at, updated_at)
VALUES (
    1,
    'ERP Flow Tecnologia e Gestão Ltda',
    'ERP Flow Soluções',
    '12.345.678/0001-90',
    'contato@erpflow.com',
    '(11) 3456-7890',
    'Av. Paulista, 1000 - Bela Vista',
    'São Paulo',
    'SP',
    '01310-100',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 2. USUÁRIOS PADRÃO
-- Senha de admin@erpflow.com: admin123
-- Senha de operador@erpflow.com: operador123
INSERT INTO users (id, company_id, name, email, password_hash, role, active, created_at, updated_at)
VALUES 
(
    1,
    1,
    'Administrador do Sistema',
    'admin@erpflow.com',
    '$2a$10$nwiG08U0vN0g8xFueoo15eob6YaiBX1eESfBiySJaj.iOmqZwBEG.',
    'ADMIN',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    2,
    1,
    'Operador de Vendas',
    'operador@erpflow.com',
    '$2a$10$CV4mSGSPbVZ5Bmnw/9i0XeXDykOwRHe8kfaEDPLaNpBW9H2TwDoBi',
    'OPERADOR',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 3. CATEGORIAS DE EXEMPLO
INSERT INTO categories (id, company_id, name, description, active, created_at, updated_at)
VALUES 
(1, 1, 'Informática & Periféricos', 'Equipamentos e acessórios de computação', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 1, 'Escritório & Papelaria', 'Artigos de escritório e suprimentos gerais', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 1, 'Mobiliário', 'Cadeiras ergonômicas, mesas e estações de trabalho', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4. FORNECEDORES DE EXEMPLO
INSERT INTO suppliers (id, company_id, corporate_name, trade_name, document, email, phone, address, city, state, zip_code, notes, active, created_at, updated_at)
VALUES 
(
    1, 1,
    'Tech Distribuidora Nacional S/A',
    'Tech Distro',
    '98.765.432/0001-10',
    'vendas@techdistro.com.br',
    '(11) 4002-8922',
    'Rua das Indústrias, 450',
    'Campinas',
    'SP',
    '13010-000',
    'Fornecedor principal de periféricos e hardware',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    2, 1,
    'Papelaria Corporativa Central Ltda',
    'Central Papéis',
    '87.654.321/0001-20',
    'comercial@centralpapeis.com.br',
    '(19) 3211-5500',
    'Av. dos Comerciantes, 120',
    'São Paulo',
    'SP',
    '01001-000',
    'Entregas em até 48h para região metropolitana',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 5. CLIENTES DE EXEMPLO
INSERT INTO customers (id, company_id, name, document, email, phone, address, city, state, zip_code, notes, active, created_at, updated_at)
VALUES 
(
    1, 1,
    'Delta Consultoria Empresarial ME',
    '23.456.789/0001-01',
    'financeiro@deltaconsultoria.com.br',
    '(11) 98765-4321',
    'Rua Funchal, 200 - Vila Olímpia',
    'São Paulo',
    'SP',
    '04551-060',
    'Cliente corporativo nível A, faturamento quinzenal',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    2, 1,
    'Ana Paula Martins',
    '123.456.789-00',
    'ana.martins@email.com',
    '(11) 99123-4567',
    'Rua Bela Cintra, 890 - Consolação',
    'São Paulo',
    'SP',
    '01415-000',
    'Cliente final consumidor',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 6. PRODUTOS DE EXEMPLO
INSERT INTO products (id, company_id, category_id, supplier_id, name, sku, description, unit, cost_price, sale_price, current_stock, min_stock, active, created_at, updated_at)
VALUES 
(
    1, 1, 1, 1,
    'Teclado Mecânico Ergonômico RGB Pro',
    'TEC-MEC-001',
    'Teclado com switches blue táteis e conexão USB-C removível',
    'UN',
    150.00,
    299.90,
    25.000,
    5.000,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    2, 1, 1, 1,
    'Mouse Sem Fio Sensor Óptico 16000 DPI',
    'MOU-SEM-002',
    'Mouse ergonômico com bateria recarregável e clique silencioso',
    'UN',
    80.00,
    189.00,
    4.000,  -- Abaixo do estoque mínimo para alertar no dashboard!
    10.000,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    3, 1, 2, 2,
    'Papel Sulfite A4 75g Caixa 10 Resmas',
    'PAP-SUL-003',
    'Papel de alta alvura para impressoras laser e jato de tinta',
    'CX',
    180.00,
    260.00,
    15.000,
    5.000,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    4, 1, 3, NULL,
    'Cadeira Ergonômica Presidente com Apoio de Braço 3D',
    'CAD-ERG-004',
    'Estrutura em mesh respirável com certificação NR17',
    'UN',
    600.00,
    1199.00,
    8.000,
    3.000,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 7. MOVIMENTAÇÃO DE ESTOQUE INICIAL (Auditoria e rastreio de entrada)
INSERT INTO stock_movements (company_id, product_id, user_id, type, quantity, balance_after, unit_cost, reason, source_document, created_at)
VALUES 
(1, 1, 1, 'ENTRADA', 25.000, 25.000, 150.00, 'Saldo de implantação de estoque', 'NF-1001', CURRENT_TIMESTAMP),
(1, 2, 1, 'ENTRADA', 4.000, 4.000, 80.00, 'Saldo de implantação de estoque', 'NF-1002', CURRENT_TIMESTAMP),
(1, 3, 1, 'ENTRADA', 15.000, 15.000, 180.00, 'Saldo de implantação de estoque', 'NF-1003', CURRENT_TIMESTAMP),
(1, 4, 1, 'ENTRADA', 8.000, 8.000, 600.00, 'Saldo de implantação de estoque', 'NF-1004', CURRENT_TIMESTAMP);

-- Ajustar sequences para que os próximos INSERTs automáticos continuem dos IDs corretos
SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('suppliers_id_seq', (SELECT MAX(id) FROM suppliers));
SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
