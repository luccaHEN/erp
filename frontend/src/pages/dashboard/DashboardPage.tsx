import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingCart,
  Boxes,
  Plus,
  Loader2,
  Calendar,
  Award,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { DashboardOverview, SalesByPeriod, TopProduct } from '../../types/models';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Queries
  const { data: overview, isLoading: isOverviewLoading } = useQuery<DashboardOverview>({
    queryKey: ['dashboard-overview'],
    queryFn: async () => {
      const res = await api.get('/dashboard/overview');
      return res.data;
    },
  });

  const { data: chartData, isLoading: isChartLoading } = useQuery<SalesByPeriod[]>({
    queryKey: ['dashboard-sales-chart'],
    queryFn: async () => {
      const res = await api.get('/dashboard/sales-chart', { params: { days: 14 } });
      return res.data;
    },
  });

  const { data: topProducts, isLoading: isTopLoading } = useQuery<TopProduct[]>({
    queryKey: ['dashboard-top-products'],
    queryFn: async () => {
      const res = await api.get('/dashboard/top-products', { params: { limit: 5 } });
      return res.data;
    },
  });

  const formattedChartData =
    chartData?.map((item) => ({
      date: formatDate(item.date).substring(0, 5), // 'DD/MM'
      fullDate: formatDate(item.date),
      totalAmount: Number(item.totalAmount) || 0,
      salesCount: item.salesCount,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-800 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-sm mb-3">
              <span>{user?.companyName}</span>
              <span>•</span>
              <span>CNPJ Demo</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Olá, {user?.name}! Painel de Controle ERP Flow
            </h2>
            <p className="text-sm text-blue-100 mt-1">
              Indicadores consolidados em tempo real com isolamento multitenant no PostgreSQL.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/sales"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nova Venda (PDV)
            </Link>
            <Link
              to="/inventory"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
            >
              <Boxes className="w-4 h-4" />
              Estoque
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento do Mês */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Vendas do Mês</span>
            <div className="p-2 bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {isOverviewLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
            ) : (
              formatCurrency(overview?.monthlyRevenue || 0)
            )}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
            <ShoppingCart className="w-3.5 h-3.5 text-primary-500" />
            <span>{overview?.monthlySalesCount || 0} pedidos faturados neste mês</span>
          </p>
        </div>

        {/* Card 2: Contas a Receber */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">A Receber em Aberto</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {isOverviewLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
            ) : (
              formatCurrency(overview?.pendingReceivables || 0)
            )}
          </div>
          <p className="text-xs text-neutral-500 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            Entradas previstas de vendas e títulos
          </p>
        </div>

        {/* Card 3: Contas a Pagar */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">A Pagar em Aberto</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {isOverviewLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
            ) : (
              formatCurrency(overview?.pendingPayables || 0)
            )}
          </div>
          <p className="text-xs text-neutral-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-rose-500" />
            Obrigações e fornecedores pendentes
          </p>
        </div>

        {/* Card 4: Alerta de Estoque Baixo */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Estoque Baixo</span>
            <div
              className={`p-2 rounded-lg ${
                (overview?.lowStockCount || 0) > 0
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold ${
              (overview?.lowStockCount || 0) > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-neutral-900 dark:text-neutral-100'
            }`}
          >
            {isOverviewLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
            ) : (
              overview?.lowStockCount || 0
            )}
          </div>
          <p className="text-xs text-neutral-500">
            {(overview?.lowStockCount || 0) > 0
              ? 'Produtos atingiram ou estão abaixo do estoque mínimo'
              : 'Nenhum produto em nível crítico'}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: Evolução Diária de Vendas (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Evolução de Vendas (Últimos 14 Dias)
              </h3>
              <p className="text-xs text-neutral-500">Faturamento diário de pedidos confirmados</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {isChartLoading ? (
              <div className="h-full flex items-center justify-center text-neutral-400">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#888" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#888"
                    tickFormatter={(v) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      borderColor: '#374151',
                      borderRadius: '0.75rem',
                      color: '#f9fafb',
                      fontSize: '0.85rem',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    }}
                    itemStyle={{ color: '#60a5fa' }}
                    labelStyle={{ color: '#f3f4f6', fontWeight: 600, marginBottom: '0.25rem' }}
                    formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Faturamento']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalAmount"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#salesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico 2: Top Produtos Mais Vendidos (1 col) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Mais Vendidos
              </h3>
              <p className="text-xs text-neutral-500">Ranking por receita gerada</p>
            </div>
          </div>

          {isTopLoading ? (
            <div className="h-64 flex items-center justify-center text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : !topProducts || topProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-neutral-400 text-center px-4">
              <ShoppingCart className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mb-2" />
              <p className="text-sm">Nenhuma venda registrada ainda no período.</p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {topProducts.map((p, idx) => (
                <div key={p.productId} className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[140px]">
                        {p.productName}
                      </div>
                      <div className="text-xs text-neutral-400">SKU: {p.productSku} • Qtd: {p.quantitySold}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {formatCurrency(p.totalRevenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
