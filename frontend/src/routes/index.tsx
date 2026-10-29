import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';

// Cadastros (Fase 2)
import { CompanyPage } from '../pages/company/CompanyPage';
import { UsersPage } from '../pages/users/UsersPage';
import { CustomersPage } from '../pages/customers/CustomersPage';
import { SuppliersPage } from '../pages/suppliers/SuppliersPage';
import { CategoriesPage } from '../pages/categories/CategoriesPage';
import { ProductsPage } from '../pages/products/ProductsPage';

// Operações (Fase 3)
import { InventoryPage } from '../pages/inventory/InventoryPage';
import { SalesPage } from '../pages/sales/SalesPage';
import { FinancialPage } from '../pages/financial/FinancialPage';

// Gestão (Fase 4)
import { ReportsPage } from '../pages/reports/ReportsPage';
import { AuditPage } from '../pages/audit/AuditPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />

          {/* Cadastros (Fase 2 - 100% Funcionais) */}
          <Route path="/companies" element={<CompanyPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/products" element={<ProductsPage />} />

          {/* Operações (Fase 3 - 100% Funcionais) */}
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/financial" element={<FinancialPage />} />

          {/* Gestão (Fase 4 - 100% Funcionais) */}
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/audit" element={<AuditPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
