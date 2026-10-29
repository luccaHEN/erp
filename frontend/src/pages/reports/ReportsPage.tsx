import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Download,
  ShoppingCart,
  Boxes,
  DollarSign,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDateTime, formatDate } from '../../lib/utils';
import type {
  SalesReportItem,
  InventoryReportItem,
  FinancialReportItem,
  SaleStatus,
  FinancialType,
  FinancialStatus,
} from '../../types/models';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SALES' | 'INVENTORY' | 'FINANCIAL'>('SALES');
  const [isExporting, setIsExporting] = useState(false);

  // Filtros de Vendas
  const [salesStatus, setSalesStatus] = useState<string>('ALL');
  const [salesStartDate, setSalesStartDate] = useState('');
  const [salesEndDate, setSalesEndDate] = useState('');

  // Filtros de Estoque
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Filtros Financeiro
  const [finType, setFinType] = useState<string>('ALL');
  const [finStatus, setFinStatus] = useState<string>('ALL');
  const [finStartDate, setFinStartDate] = useState('');
  const [finEndDate, setFinEndDate] = useState('');

  // Query Vendas
  const { data: salesData, isLoading: isSalesLoading } = useQuery<SalesReportItem[]>({
    queryKey: ['report-sales', salesStatus, salesStartDate, salesEndDate],
    queryFn: async () => {
      const res = await api.get('/reports/sales', {
        params: {
          status: salesStatus === 'ALL' ? undefined : (salesStatus as SaleStatus),
          startDate: salesStartDate ? `${salesStartDate}T00:00:00Z` : undefined,
          endDate: salesEndDate ? `${salesEndDate}T23:59:59Z` : undefined,
        },
      });
      return res.data;
    },
    enabled: activeTab === 'SALES',
  });

  // Query Estoque
  const { data: inventoryData, isLoading: isInventoryLoading } = useQuery<InventoryReportItem[]>({
    queryKey: ['report-inventory', lowStockOnly],
    queryFn: async () => {
      const res = await api.get('/reports/inventory', {
        params: { lowStockOnly: lowStockOnly || undefined },
      });
      return res.data;
    },
    enabled: activeTab === 'INVENTORY',
  });

  // Query Financeiro
  const { data: financialData, isLoading: isFinancialLoading } = useQuery<FinancialReportItem[]>({
    queryKey: ['report-financial', finType, finStatus, finStartDate, finEndDate],
    queryFn: async () => {
      const res = await api.get('/reports/financial', {
        params: {
          type: finType === 'ALL' ? undefined : (finType as FinancialType),
          status: finStatus === 'ALL' ? undefined : (finStatus as FinancialStatus),
          startDate: finStartDate || undefined,
          endDate: finEndDate || undefined,
        },
      });
      return res.data;
    },
    enabled: activeTab === 'FINANCIAL',
  });

  // Exportar CSV
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      let endpoint = '';
      let filename = 'relatorio.csv';
      let params: Record<string, any> = {};

      if (activeTab === 'SALES') {
        endpoint = '/reports/sales/csv';
        filename = 'relatorio-vendas.csv';
        params = {
          status: salesStatus === 'ALL' ? undefined : salesStatus,
          startDate: salesStartDate ? `${salesStartDate}T00:00:00Z` : undefined,
          endDate: salesEndDate ? `${salesEndDate}T23:59:59Z` : undefined,
        };
      } else if (activeTab === 'INVENTORY') {
        endpoint = '/reports/inventory/csv';
        filename = 'relatorio-estoque.csv';
        params = { lowStockOnly: lowStockOnly || undefined };
      } else if (activeTab === 'FINANCIAL') {
        endpoint = '/reports/financial/csv';
        filename = 'relatorio-financeiro.csv';
        params = {
          type: finType === 'ALL' ? undefined : finType,
          status: finStatus === 'ALL' ? undefined : finStatus,
          startDate: finStartDate || undefined,
          endDate: finEndDate || undefined,
        };
      }

      const response = await api.get(endpoint, {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Erro ao exportar CSV', err);
      alert('Erro ao realizar download do relatório.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            Relatórios & Exportações
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Relatórios analíticos consolidados com exportação protegida em formato CSV para planilhas.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={isExporting}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Exportar CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setActiveTab('SALES')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'SALES'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Vendas por Período
        </button>
        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'INVENTORY'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Posição de Estoque
        </button>
        <button
          onClick={() => setActiveTab('FINANCIAL')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'FINANCIAL'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Extrato Financeiro
        </button>
      </div>

      {/* Aba 1: Vendas */}
      {activeTab === 'SALES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Status da Venda</label>
              <select
                value={salesStatus}
                onChange={(e) => setSalesStatus(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todos os status</option>
                <option value="CONFIRMADA">Apenas Confirmadas</option>
                <option value="ORCAMENTO">Apenas Orçamentos</option>
                <option value="CANCELADA">Apenas Canceladas</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Data Inicial</label>
              <input
                type="date"
                value={salesStartDate}
                onChange={(e) => setSalesStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Data Final</label>
              <input
                type="date"
                value={salesEndDate}
                onChange={(e) => setSalesEndDate(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-xs uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-3">Número</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Vendedor</th>
                  <th className="px-6 py-3">Pagamento</th>
                  <th className="px-6 py-3 text-right">Subtotal</th>
                  <th className="px-6 py-3 text-right">Desconto</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {isSalesLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-neutral-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-500 mb-2" />
                      Carregando relatório de vendas...
                    </td>
                  </tr>
                ) : !salesData || salesData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-neutral-500">
                      Nenhum registro encontrado para o período.
                    </td>
                  </tr>
                ) : (
                  salesData.map((item) => (
                    <tr key={item.saleId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                      <td className="px-6 py-3 font-mono font-medium">{item.saleNumber}</td>
                      <td className="px-6 py-3">{formatDateTime(item.saleDate)}</td>
                      <td className="px-6 py-3">{item.customerName}</td>
                      <td className="px-6 py-3">{item.userName}</td>
                      <td className="px-6 py-3">{item.paymentMethod}</td>
                      <td className="px-6 py-3 text-right">{formatCurrency(item.subtotal)}</td>
                      <td className="px-6 py-3 text-right text-rose-500">
                        {item.discount > 0 ? `- ${formatCurrency(item.discount)}` : '-'}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(item.totalAmount)}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Aba 2: Posição de Estoque */}
      {activeTab === 'INVENTORY' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-primary-600 border-neutral-300 dark:border-neutral-700"
              />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Exibir apenas produtos com estoque baixo ou zerado
              </span>
            </label>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-xs uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-3">Produto</th>
                  <th className="px-6 py-3">Categoria</th>
                  <th className="px-6 py-3 text-right">Estoque Atual</th>
                  <th className="px-6 py-3 text-right">Estoque Mínimo</th>
                  <th className="px-6 py-3 text-right">Preço de Custo</th>
                  <th className="px-6 py-3 text-right">Preço de Venda</th>
                  <th className="px-6 py-3 text-right">Valor em Custo</th>
                  <th className="px-6 py-3 text-right">Valor em Venda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {isInventoryLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-neutral-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-500 mb-2" />
                      Carregando posição de estoque...
                    </td>
                  </tr>
                ) : !inventoryData || inventoryData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-neutral-500">
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                ) : (
                  inventoryData.map((item) => (
                    <tr key={item.productId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                      <td className="px-6 py-3">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">{item.name}</div>
                        <div className="text-xs text-neutral-400">SKU: {item.sku}</div>
                      </td>
                      <td className="px-6 py-3">{item.categoryName}</td>
                      <td className="px-6 py-3 text-right font-semibold">
                        <span className={item.lowStock ? 'text-amber-600 dark:text-amber-400' : ''}>
                          {item.currentStock} {item.unit}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-neutral-500">{item.minStock} {item.unit}</td>
                      <td className="px-6 py-3 text-right">{formatCurrency(item.costPrice)}</td>
                      <td className="px-6 py-3 text-right">{formatCurrency(item.salePrice)}</td>
                      <td className="px-6 py-3 text-right font-medium">{formatCurrency(item.totalCostValue)}</td>
                      <td className="px-6 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(item.totalSaleValue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Aba 3: Financeiro */}
      {activeTab === 'FINANCIAL' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Tipo</label>
              <select
                value={finType}
                onChange={(e) => setFinType(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todos os tipos</option>
                <option value="RECEBER">Contas a Receber</option>
                <option value="PAGAR">Contas a Pagar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Status</label>
              <select
                value={finStatus}
                onChange={(e) => setFinStatus(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todos os status</option>
                <option value="PENDENTE">Pendente</option>
                <option value="PAGO">Pago</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Vencimento Inicial</label>
              <input
                type="date"
                value={finStartDate}
                onChange={(e) => setFinStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Vencimento Final</label>
              <input
                type="date"
                value={finEndDate}
                onChange={(e) => setFinEndDate(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-xs uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3">Descrição</th>
                  <th className="px-6 py-3">Categoria</th>
                  <th className="px-6 py-3">Cliente / Fornecedor</th>
                  <th className="px-6 py-3">Vencimento</th>
                  <th className="px-6 py-3">Pagamento</th>
                  <th className="px-6 py-3 text-right">Valor</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {isFinancialLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-neutral-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-500 mb-2" />
                      Carregando relatório financeiro...
                    </td>
                  </tr>
                ) : !financialData || financialData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-neutral-500">
                      Nenhum lançamento encontrado.
                    </td>
                  </tr>
                ) : (
                  financialData.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                      <td className="px-6 py-3 font-semibold">
                        <span className={item.type === 'RECEBER' ? 'text-emerald-600' : 'text-rose-600'}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                        {item.description}
                      </td>
                      <td className="px-6 py-3">{item.category}</td>
                      <td className="px-6 py-3">{item.relatedEntity}</td>
                      <td className="px-6 py-3">{formatDate(item.dueDate)}</td>
                      <td className="px-6 py-3">{item.paymentDate ? formatDate(item.paymentDate) : '-'}</td>
                      <td className="px-6 py-3 text-right font-semibold">
                        <span className={item.type === 'RECEBER' ? 'text-emerald-600' : 'text-rose-600'}>
                          {formatCurrency(item.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 font-medium">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
