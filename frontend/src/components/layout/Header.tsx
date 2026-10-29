import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sun, Moon, LogOut, Menu, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  onMobileToggle: () => void;
}

const routeTitles: Record<string, string> = {
  '/': 'Visão Geral do Dashboard',
  '/companies': 'Gestão de Empresas',
  '/users': 'Controle de Usuários',
  '/customers': 'Cadastro de Clientes',
  '/suppliers': 'Cadastro de Fornecedores',
  '/categories': 'Categorias de Produtos',
  '/products': 'Catálogo de Produtos',
  '/inventory': 'Controle de Estoque & Movimentações',
  '/sales': 'Vendas & Emissão de Pedidos',
  '/financial': 'Módulo Financeiro (Pagar / Receber)',
  '/reports': 'Relatórios & Exportações',
  '/audit': 'Trilha de Auditoria do Sistema',
};

export const Header: React.FC<HeaderProps> = ({ onMobileToggle }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const currentTitle = routeTitles[location.pathname] || 'ERP Flow';

  return (
    <header className="h-16 border-b border-border bg-card px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileToggle}
          className="md:hidden p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{currentTitle}</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Ambiente Corporativo: <span className="font-medium text-foreground">{user?.companyName}</span>
          </p>
        </div>
      </div>

      {/* Right: Theme Toggle & User Info & Logout */}
      <div className="flex items-center gap-3">
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          title={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* User Card */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold text-xs shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-foreground leading-tight">{user?.name}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                  user?.role === 'ADMIN'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                }`}
              >
                {user?.role}
              </span>
              <span className="text-[11px] text-muted-foreground">{user?.email}</span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            title="Sair do Sistema"
            className="p-2 ml-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
