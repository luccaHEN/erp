# ERP Flow — Sistema de Gestão Empresarial

[![Java 21](https://img.shields.io/badge/Java-21_LTS-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot 3.3.5](https://img.shields.io/badge/Spring_Boot-3.3.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18.3-blue.svg)](https://www.postgresql.org/)
[![React 18](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38bdf8.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

ERP Web moderno, robusto e escalável para pequenas e médias empresas, desenvolvido como um **Monólito Modular** de ponta a ponta com **Java 21**, **Spring Boot 3**, **PostgreSQL** e **React + TypeScript + Tailwind CSS**.

O projeto foi construído para demonstrar excelência técnica, boas práticas de desenvolvimento, **isolamento multitenant estrito** por empresa, integridade de dados por **Flyway**, controle concorrente com **travas pessimistas** para estoque, valores monetários com **`BigDecimal`**, autenticação **JWT** stateless e interface de usuário SaaS moderna.

---

## 1. Destaques Arquiteturais & Engenharia

- **Monólito Modular**: Organização estrita por domínios de negócio (`auth`, `company`, `user`, `customer`, `supplier`, `product`, `inventory`, `sales`, `financial`, `dashboard`, `report`, `audit`), evitando acoplamentos circulares ou microsserviços desnecessários.
- **Multitenancy Estrito (Row-Level Security)**:
  - O `company_id` é injetado diretamente no token JWT e propagado via `TenantContext` (ThreadLocal).
  - O backend nunca confia em IDs enviados pelo cliente nas requisições: todas as consultas filtram rigorosamente pela empresa do usuário autenticado.
- **Controle Concorrente de Estoque**:
  - Uso de bloqueio pessimista (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) ao debitar ou creditar estoque, garantindo que compras concorrentes no PDV jamais resultem em saldo negativo.
  - O estoque atual é imutável: só se altera via movimentações rastreáveis (`StockMovement`).
- **Precisão Financeira**:
  - Todos os cálculos monetários e quantidades fracionárias utilizam exclusivamente `BigDecimal` com arredondamento `HALF_UP`.
- **Segurança contra Injeção em Planilhas**:
  - As exportações em formato CSV sanitizam caracteres de fórmula (`=`, `+`, `-`, `@`) para prevenir vulnerabilidades de CSV/Formula Injection ao abrir arquivos no Microsoft Excel e LibreOffice Calc.
- **Trilha de Auditoria**:
  - Registro de auditoria (`AuditLog`) de operações sensíveis (faturamento de pedidos, estornos, ajustes manuais de estoque, cancelamento de títulos).

---

## 2. Tecnologias Utilizadas

### Backend
- **Java 21 LTS**
- **Spring Boot 3.3.5**
- **Spring Data JPA** & Hibernate 6
- **Spring Security 6** com **JWT (io.jsonwebtoken 0.12.6)**
- **Bean Validation** (Hibernate Validator)
- **PostgreSQL 18** (Compatível com PG 16+)
- **Flyway** para migrações e versionamento do esquema relacional
- **Springdoc OpenAPI / Swagger UI**
- **JUnit 5** & **Mockito**
- **Maven Wrapper (`mvnw.cmd`)**

### Frontend
- **React 18** + **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Lucide React** (Ícones modernos)
- **React Router Dom 6** (Rotas protegidas, layouts aninhados e navegação SPA)
- **TanStack React Query 5** (Gerenciamento de estado de servidor e cache)
- **React Hook Form** + **Zod** (Validação de formulários e tipagem estrita)
- **Axios** (Interceptors para token JWT)
- **Recharts** (Visualização analítica de evolução de vendas e rankings)

---

## 3. Estrutura do Projeto

```text
erp/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/erpflow/
│   │   │   │   ├── ErpFlowApplication.java
│   │   │   │   ├── shared/                # Infraestrutura transversal
│   │   │   │   │   ├── config/            # OpenAPI e WebMvc CORS
│   │   │   │   │   ├── exception/         # Tratamento global de erros (RFC 7807)
│   │   │   │   │   └── security/          # JWT Filter, TenantContext e SecurityConfig
│   │   │   │   ├── auth/                  # Login, me e geração de tokens JWT
│   │   │   │   ├── company/               # Gestão de Empresas (Multitenancy)
│   │   │   │   ├── user/                  # Controle de Usuários e Perfis (ADMIN/OPERADOR)
│   │   │   │   ├── customer/              # Clientes e validação de documento
│   │   │   │   ├── supplier/              # Fornecedores
│   │   │   │   ├── product/               # Produtos e Categorias
│   │   │   │   ├── inventory/             # Controle de Estoque (com lock pessimista)
│   │   │   │   ├── sales/                 # Vendas, Orçamentos e PDV
│   │   │   │   ├── financial/             # Contas a Pagar e Receber
│   │   │   │   ├── dashboard/             # Indicadores consolidados e gráficos
│   │   │   │   ├── report/                # Relatórios e exportação segura em CSV
│   │   │   │   └── audit/                 # Trilha de Auditoria (Restrita a ADMIN)
│   │   │   └── resources/
│   │   │       ├── db/migration/          # Migrações Flyway (V1 Schema, V2 Seed)
│   │   │       └── application.yml
│   │   └── test/                          # Suíte de 14 testes de integração com MockMvc
│   ├── mvnw
│   ├── mvnw.cmd
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/                    # Sidebar, Header, Modal, Badge, Pagination
│   │   ├── context/                       # AuthContext, ThemeContext
│   │   ├── lib/                           # Utilitários de formatação (moeda BRL, datas)
│   │   ├── pages/                         # Telas funcionais de todos os domínios
│   │   │   ├── auth/                      # Login
│   │   │   ├── dashboard/                 # Dashboard com Recharts e KPIs
│   │   │   ├── company/                   # Gestão de Empresas
│   │   │   ├── users/                     # Usuários e Perfis
│   │   │   ├── customers/                 # Clientes
│   │   │   ├── suppliers/                 # Fornecedores
│   │   │   ├── categories/                # Categorias
│   │   │   ├── products/                  # Produtos e Estoque Mínimo
│   │   │   ├── inventory/                 # Extrato e Movimentações de Estoque
│   │   │   ├── sales/                     # Vendas e Pedidos (PDV)
│   │   │   ├── financial/                 # Gestão Financeira (Receber e Pagar)
│   │   │   ├── reports/                   # Relatórios com download de CSV
│   │   │   └── audit/                     # Trilha de Auditoria
│   │   ├── routes/                        # Definição e proteção de rotas
│   │   ├── services/                      # Cliente Axios com interceptors
│   │   └── types/                         # Interfaces TypeScript alinhadas aos DTOs
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── README.md
└── .gitignore
```

---

## 4. Guia de Execução (Direto no Windows)

> **Nota:** O projeto foi desenhado para ser executado nativamente no Windows sem nenhuma necessidade de Docker.

### Pré-requisitos
1. **Java 21 LTS** instalado (`java -version`).
2. **Node.js 20+** instalado (`node -v`).
3. **PostgreSQL** instalado e em execução na porta `5432`.

### 1. Configurar o Banco de Dados PostgreSQL
Abra o terminal do PostgreSQL (`psql`) ou ferramenta como pgAdmin/DBeaver e crie o banco:

```sql
CREATE DATABASE erp_flow;
```

O arquivo [`backend/src/main/resources/application.yml`](file:///C:/Users/lucca/Documents/erp/backend/src/main/resources/application.yml) está pré-configurado para conectar ao PostgreSQL local na porta `5432`. Caso sua senha seja diferente, ajuste a variável `SPRING_DATASOURCE_PASSWORD` ou o arquivo de configuração.

### 2. Executar o Backend (Spring Boot)
No terminal PowerShell, entre no diretório `backend` e execute o Maven Wrapper:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

O Flyway aplicará automaticamente as migrações:
- `V1__init_schema.sql`: Cria todas as 11 tabelas relacionais com índices e constraints multitenant.
- `V2__seed_initial_data.sql`: Popula a empresa demo, usuários iniciais com senhas criptografadas em BCrypt, clientes, fornecedores, categorias e produtos para teste imediato.

A API estará disponível em: `http://localhost:8080`.  
A documentação interativa Swagger UI estará acessível em: `http://localhost:8080/swagger-ui/index.html`.

### 3. Executar o Frontend (React + Vite)
Em outro terminal PowerShell, entre no diretório `frontend`:

```powershell
cd frontend
npm.cmd run dev
```

A interface web SaaS estará disponível em: `http://localhost:5173`.

---

## 5. Credenciais de Acesso Demo

| Perfil | E-mail | Senha | Permissões |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@erpflow.com` | `admin123` | Acesso irrestrito a todos os módulos, incluindo Empresas, Usuários e Auditoria. |
| **Operador** | `operador@erpflow.com` | `operador123` | Acesso operacional a Clientes, Fornecedores, Produtos, Estoque, Vendas e Financeiro. |

---

## 6. Módulos e Funcionalidades

### 🛒 Vendas & Pedidos (PDV)
- Emissão de pedidos com status `ORCAMENTO`, `CONFIRMADA` e `CANCELADA`.
- Carrinho dinâmico de produtos com cálculo automático de subtotal, descontos por item e desconto geral.
- Preservação do preço unitário histórico do momento da venda.
- Faturamento com baixa atômica no estoque e geração de títulos em Contas a Receber.
- Cancelamento de venda com estorno automático de estoque (`ESTORNO_VENDA`) e cancelamento de duplicatas pendentes.

### 📦 Controle de Estoque
- Extrato imutável de movimentações (`ENTRADA`, `SAIDA`, `AJUSTE_POSITIVO`, `AJUSTE_NEGATIVO`, `SAIDA_VENDA`, `ESTORNO_VENDA`).
- Controle de estoque mínimo com alertas visuais e filtros rápidos.
- Bloqueio pessimista contra concorrência concorrente.

### 💵 Gestão Financeira
- Contas a Pagar e Contas a Receber.
- Controle rigoroso de vencimentos e destaque para títulos vencidos.
- Liquidação / baixa de títulos com registro de data efetiva e meio de pagamento.
- Cálculo de saldo financeiro projetado.

### 📊 Dashboard & Métricas
- Indicadores em tempo real: faturamento do mês, contagem de vendas faturadas, contas a receber, contas a pagar e alerta de estoque.
- Gráfico de área com evolução diária de vendas (Recharts).
- Ranking dos produtos mais vendidos por receita.

### 📑 Relatórios & Exportações Seguras
- Relatório analítico de vendas com filtros por status e intervalo de datas.
- Relatório de posição de estoque com cálculo de valor total a preço de custo e venda.
- Extrato financeiro de contas a pagar e receber.
- Exportação em formato `.csv` com encoding UTF-8 (BOM para compatibilidade com Excel) e proteção contra CSV Injection.

### 🛡️ Trilha de Auditoria
- Registro de logs de auditoria (`AuditLog`) para operações de segurança e negócio.
- Acesso exclusivo para o perfil `ADMIN`.

---

## 7. Suíte de Testes Automatizados

O projeto conta com suíte de testes de integração cobrindo fluxos essenciais de ponta a ponta:

```powershell
cd backend
.\mvnw.cmd test
```

### Cobertura de Testes:
- **`AuthControllerTest`**: Login bem-sucedido com emissão de JWT, rejeição de credenciais incorretas, proteção de rotas privadas contra requisições sem token.
- **`CadastrosIntegrationTest`**: Cadastro de cliente com validação de documento duplicado, cadastro de produtos com SKU único por empresa, listagem de categorias.
- **`OperacoesIntegrationTest`**:
  - Movimentação manual de estoque com atualização atômica de saldo.
  - Fluxo completo de venda: validação de estoque -> gravação de venda -> baixa de estoque via `SAIDA_VENDA` -> criação de contas a receber.
  - Bloqueio de venda com quantidade superior ao saldo em estoque.
  - Cancelamento de venda com estorno de estoque (`ESTORNO_VENDA`) e cancelamento de título financeiro.
- **`GestaoIntegrationTest`**:
  - Consulta de KPIs do Dashboard em tempo real.
  - Geração de gráficos e ranking de produtos.
  - Exportação de relatórios em CSV com headers HTTP adequados e sanitização.
  - Validação de permissões de segurança da trilha de auditoria (permissão para `ADMIN`, bloqueio para anônimos).

---

## 8. Licença

Este projeto é disponibilizado sob a licença [MIT](LICENSE). Desenvolvido para fins de estudo e portfólio profissional de arquitetura de software e desenvolvimento full-stack.
