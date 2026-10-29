import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  Truck,
  Package,
  Layers,
  Boxes,
  ShoppingCart,
  Wallet,
  FileBarChart,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const navSections: { title: string; items: NavItem[] }[] = [
    {
      title: 'Principal',
      items: [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Cadastros',
      items: [
        { name: 'Empresas', href: '/companies', icon: Building2, adminOnly: true },
        { name: 'Usuários', href: '/users', icon: Users, adminOnly: true },
        { name: 'Clientes', href: '/customers', icon: UserCheck },
        { name: 'Fornecedores', href: '/suppliers', icon: Truck },
        { name: 'Categorias', href: '/categories', icon: Layers },
        { name: 'Produtos', href: '/products', icon: Package },
      ],
    },
    {
      title: 'Operações',
      items: [
        { name: 'Estoque', href: '/inventory', icon: Boxes },
        { name: 'Vendas (PDV)', href: '/sales', icon: ShoppingCart },
        { name: 'Financeiro', href: '/financial', icon: Wallet },
      ],
    },
    {
      title: 'Gestão & Controle',
      items: [
        { name: 'Relatórios', href: '/reports', icon: FileBarChart },
        { name: 'Auditoria', href: '/audit', icon: ShieldAlert, adminOnly: true },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out select-none z-30',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-foreground">ERP Flow</span>
              <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[140px]">
                {user?.companyName || 'Gestão Empresarial'}
              </span>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expandir Menu' : 'Recolher Menu'}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {navSections.map((section, idx) => {
          const visibleItems = section.items.filter(item => !item.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <h4 className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {section.title}
                </h4>
              )}
              {visibleItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group',
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )
                  }
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3 border-t border-border text-center text-[11px] text-muted-foreground">
          ERP Flow v1.0.0 &bull; Java 21 + React
        </div>
      )}
    </aside>
  );
};
