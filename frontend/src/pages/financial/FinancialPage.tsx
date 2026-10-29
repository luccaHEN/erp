import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Wallet,
} from 'lucide-react';
import api from '../../services/api';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { formatCurrency, formatDate, extractErrorMessage } from '../../lib/utils';
import type {
  FinancialEntry,
  FinancialType,
  FinancialStatus,
  PaymentMethod,
  FinancialSummary,
  Customer,
  Supplier,
  PageResponse,
} from '../../types/models';

export const FinancialPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'ALL' | 'RECEBER' | 'PAGAR'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);

  // Modals state
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FinancialEntry | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settle inputs
  const [settleDate, setSettleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('PIX');

  // New Entry Form State
  const [entryType, setEntryType] = useState<FinancialType>('RECEBER');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Geral');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customerId, setCustomerId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');

  // Queries: Customers and Suppliers
  const { data: customersPage } = useQuery<PageResponse<Customer>>({
    queryKey: ['customers-financial-select'],
    queryFn: async () => {
      const res = await api.get('/customers', { params: { size: 100, active: true } });
      return res.data;
    },
  });
  const customers = customersPage?.content || [];

  const { data: suppliersPage } = useQuery<PageResponse<Supplier>>({
    queryKey: ['suppliers-financial-select'],
    queryFn: async () => {
      const res = await api.get('/suppliers', { params: { size: 100, active: true } });
      return res.data;
    },
  });
  const suppliers = suppliersPage?.content || [];

  // Summary Query
  const { data: summary } = useQuery<FinancialSummary>({
    queryKey: ['financial-summary'],
    queryFn: async () => {
      const res = await api.get('/financial/summary');
      return res.data;
    },
  });

  // Entries List Query
  const typeParam = activeTab === 'ALL' ? undefined : activeTab;
  const statusParam = selectedStatus === 'ALL' ? undefined : (selectedStatus as FinancialStatus);

  const { data, isLoading } = useQuery<PageResponse<FinancialEntry>>({
    queryKey: ['financial-entries', page, activeTab, selectedStatus, searchTerm, startDate, endDate],
    queryFn: async () => {
      const res = await api.get('/financial', {
        params: {
          page,
          size: 15,
          type: typeParam,
          status: statusParam,
          search: searchTerm || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      return res.data;
    },
  });

  // Create Entry Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const parsedAmount = Number(String(amount).replace(',', '.'));
      if (!description.trim()) {
        throw new Error('A descrição é obrigatória.');
      }
      if (!dueDate) {
        throw new Error('A data de vencimento é obrigatória.');
      }
      if (!parsedAmount || parsedAmount <= 0) {
        throw new Error('Informe um valor monetário válido maior que zero.');
      }

      const payload = {
        description: description.trim(),
        type: entryType,
        category: category.trim(),
        amount: parsedAmount,
        dueDate,
        customerId: entryType === 'RECEBER' && customerId ? Number(customerId) : null,
        supplierId: entryType === 'PAGAR' && supplierId ? Number(supplierId) : null,
        notes: notes.trim() || null,
      };
      const res = await api.post('/financial', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-entries'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      setIsNewEntryOpen(false);
      resetNewEntryForm();
    },
    onError: (err: any) => {
      setErrorMessage(extractErrorMessage(err, 'Erro ao registrar título financeiro.'));
    },
  });

  // Settle Mutation (Baixa)
  const settleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEntry) return;
      const res = await api.patch(`/financial/${selectedEntry.id}/settle`, null, {
        params: {
          paymentDate: settleDate,
          paymentMethod: settleMethod,
        },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-entries'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      setIsSettleOpen(false);
      setSelectedEntry(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Erro ao liquidar título.');
    },
  });

  // Cancel Mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.patch(`/financial/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-entries'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Erro ao cancelar lançamento.');
    },
  });

  const resetNewEntryForm = () => {
    setDescription('');
    setCategory('Geral');
    setAmount('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setCustomerId('');
    setSupplierId('');
    setNotes('');
    setErrorMessage(null);
  };

  const handleOpenNewEntry = () => {
    resetNewEntryForm();
    setIsNewEntryOpen(true);
  };

  const handleOpenSettle = (entry: FinancialEntry) => {
    setSelectedEntry(entry);
    setSettleDate(new Date().toISOString().split('T')[0]);
    setSettleMethod(entry.paymentMethod || 'PIX');
    setErrorMessage(null);
    setIsSettleOpen(true);
  };

  const entries = data?.content || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Gestão Financeira & Contas
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Controle integrado de contas a pagar, contas a receber, liquidação de títulos e projeção de caixa.
          </p>
        </div>
        <button
          onClick={handleOpenNewEntry}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Lançamento
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* A Receber */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">A Receber (Pendente)</span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(summary?.pendingReceivables || 0)}
            </div>
            {Boolean(summary?.overdueReceivables) && (
              <span className="text-xs text-rose-500 font-medium">
                Vencidos: {formatCurrency(summary?.overdueReceivables || 0)}
              </span>
            )}
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        {/* A Pagar */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">A Pagar (Pendente)</span>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {formatCurrency(summary?.pendingPayables || 0)}
            </div>
            {Boolean(summary?.overduePayables) && (
              <span className="text-xs text-rose-500 font-medium">
                Vencidos: {formatCurrency(summary?.overduePayables || 0)}
              </span>
            )}
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Saldo Projetado */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Saldo Projetado</span>
            <div
              className={`text-2xl font-bold mt-1 ${
                (summary?.netProjectedCashFlow || 0) >= 0
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(summary?.netProjectedCashFlow || 0)}
            </div>
            <span className="text-xs text-neutral-400">Receber (-) Pagar pendentes</span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Total Vencidos Geral */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Títulos Vencidos</span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {formatCurrency((summary?.overdueReceivables || 0) + (summary?.overduePayables || 0))}
            </div>
            <span className="text-xs text-neutral-400">Requer atenção imediata</span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => {
              setActiveTab('ALL');
              setPage(0);
            }}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'ALL'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            Todos os Lançamentos
          </button>
          <button
            onClick={() => {
              setActiveTab('RECEBER');
              setPage(0);
            }}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'RECEBER'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            Contas a Receber
          </button>
          <button
            onClick={() => {
              setActiveTab('PAGAR');
              setPage(0);
            }}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'PAGAR'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            Contas a Pagar
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por descrição, cliente ou fornecedor..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos os status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="PAGO">Pago / Liquidado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-6 py-3 font-semibold">Tipo</th>
                <th className="px-6 py-3 font-semibold">Descrição / Categoria</th>
                <th className="px-6 py-3 font-semibold">Cliente / Fornecedor</th>
                <th className="px-6 py-3 font-semibold">Vencimento</th>
                <th className="px-6 py-3 font-semibold text-right">Valor</th>
                <th className="px-6 py-3 font-semibold text-center">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Carregando títulos financeiros...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                    <DollarSign className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
                    Nenhum lançamento financeiro encontrado com os critérios aplicados.
                  </td>
                </tr>
              ) : (
                entries.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.type === 'RECEBER' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          Receber
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          Pagar
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">{item.description}</div>
                      <div className="text-xs text-neutral-400">
                        {item.category} {item.saleId ? `• Venda #${item.saleId}` : ''}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {item.customerName && (
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                          {item.customerName}
                        </span>
                      )}
                      {item.supplierName && (
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                          {item.supplierName}
                        </span>
                      )}
                      {!item.customerName && !item.supplierName && (
                        <span className="text-neutral-400 italic">Avulso / Direto</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm ${
                          item.overdue
                            ? 'text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1'
                            : 'text-neutral-800 dark:text-neutral-200'
                        }`}
                      >
                        {formatDate(item.dueDate)}
                        {item.overdue && (
                          <span className="text-xs px-1.5 py-0.2 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded font-normal">
                            Vencido
                          </span>
                        )}
                      </div>
                      {item.paymentDate && (
                        <div className="text-xs text-neutral-400 mt-0.5">
                          Pago em: {formatDate(item.paymentDate)} ({item.paymentMethod})
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap font-semibold">
                      <span
                        className={
                          item.type === 'RECEBER'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }
                      >
                        {item.type === 'RECEBER' ? '+' : '-'} {formatCurrency(item.amount)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {item.status === 'PAGO' && <Badge variant="success">PAGO</Badge>}
                      {item.status === 'PENDENTE' && <Badge variant="warning">PENDENTE</Badge>}
                      {item.status === 'CANCELADO' && <Badge variant="neutral">CANCELADO</Badge>}
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {item.status === 'PENDENTE' && (
                          <>
                            <button
                              onClick={() => handleOpenSettle(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 rounded-md transition-colors"
                              title="Liquidar / Dar Baixa"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Baixar
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Deseja cancelar o lançamento "${item.description}"?`)) {
                                  cancelMutation.mutate(item.id);
                                }
                              }}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                              title="Cancelar lançamento"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && (
          <Pagination
            currentPage={data.number}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            pageSize={data.size}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Modal: Novo Lançamento Financeiro */}
      <Modal
        isOpen={isNewEntryOpen}
        onClose={() => setIsNewEntryOpen(false)}
        title="Novo Lançamento Financeiro"
        description="Cadastre uma conta a pagar ou conta a receber no sistema."
        maxWidth="md"
      >
        <div className="space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
              Tipo de Movimentação *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEntryType('RECEBER')}
                className={`py-2 px-3 text-sm font-semibold rounded-lg border text-center transition-colors ${
                  entryType === 'RECEBER'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                A Receber (+)
              </button>
              <button
                type="button"
                onClick={() => setEntryType('PAGAR')}
                className={`py-2 px-3 text-sm font-semibold rounded-lg border text-center transition-colors ${
                  entryType === 'PAGAR'
                    ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                    : 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                A Pagar (-)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
              Descrição do Lançamento *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Fornecimento de Peças, Aluguel Comercial, Serviços..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                Categoria *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Operacional, Vendas..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                Data de Vencimento *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              {entryType === 'RECEBER' ? (
                <>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                    Cliente (Opcional)
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Nenhum / Avulso</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                    Fornecedor (Opcional)
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Nenhum / Avulso</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.tradeName || s.corporateName}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
              Observações (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais sobre este lançamento..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setIsNewEntryOpen(false)}
              className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                if (!description.trim() || !amount || !dueDate) {
                  setErrorMessage('Preencha os campos obrigatórios.');
                  return;
                }
                createMutation.mutate();
              }}
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors disabled:opacity-50"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar Lançamento
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Liquidar Título (Baixa) */}
      {selectedEntry && (
        <Modal
          isOpen={isSettleOpen}
          onClose={() => setIsSettleOpen(false)}
          title={`Liquidar Título: ${selectedEntry.description}`}
          description={`Valor: ${formatCurrency(selectedEntry.amount)} | Vencimento: ${formatDate(selectedEntry.dueDate)}`}
          maxWidth="sm"
        >
          <div className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                Data do Pagamento *
              </label>
              <input
                type="date"
                required
                value={settleDate}
                onChange={(e) => setSettleDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                Meio de Pagamento *
              </label>
              <select
                value={settleMethod}
                onChange={(e) => setSettleMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PIX">PIX</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="CARTAO_DEBITO">Cartão de Débito</option>
                <option value="BOLETO">Boleto Bancário</option>
                <option value="A_PRAZO">A Prazo</option>
                <option value="TRANSFERENCIA">Transferência Bancária</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsSettleOpen(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => settleMutation.mutate()}
                disabled={settleMutation.isPending}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors disabled:opacity-50"
              >
                {settleMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar Liquidação
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
