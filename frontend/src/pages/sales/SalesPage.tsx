import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart,
  Plus,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  AlertCircle,
  Loader2,
  CreditCard,
  Package,
} from 'lucide-react';
import api from '../../services/api';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { formatCurrency, formatDateTime, extractErrorMessage } from '../../lib/utils';
import type {
  Sale,
  SaleStatus,
  PaymentMethod,
  Product,
  Customer,
  PageResponse,
} from '../../types/models';

interface CartItem {
  productId: number;
  productName: string;
  sku: string;
  unitPrice: number;
  currentStock: number;
  quantity: number;
  discount: number;
  subtotal: number;
}

export const SalesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [page, setPage] = useState(0);

  // Modals state
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Sale Form State
  const [customerId, setCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [notes, setNotes] = useState('');
  const [confirmImmediately, setConfirmImmediately] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [generalDiscount, setGeneralDiscount] = useState<string>('0');

  // Selected item inputs for adding to cart
  const [selectedProductInput, setSelectedProductInput] = useState<string>('');
  const [itemQuantityInput, setItemQuantityInput] = useState<string>('1');
  const [itemDiscountInput, setItemDiscountInput] = useState<string>('0');

  // Load Customers for Dropdown
  const { data: customersPage } = useQuery<PageResponse<Customer>>({
    queryKey: ['customers-sales-select'],
    queryFn: async () => {
      const res = await api.get('/customers', { params: { size: 100, active: true } });
      return res.data;
    },
  });
  const customers = customersPage?.content || [];

  // Load Products for Dropdown
  const { data: productsPage } = useQuery<PageResponse<Product>>({
    queryKey: ['products-sales-select'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { size: 100, active: true } });
      return res.data;
    },
  });
  const products = productsPage?.content || [];

  // Query Sales list
  const statusParam = selectedStatus === 'ALL' ? undefined : (selectedStatus as SaleStatus);
  const { data, isLoading } = useQuery<PageResponse<Sale>>({
    queryKey: ['sales', page, searchTerm, statusParam],
    queryFn: async () => {
      const res = await api.get('/sales', {
        params: {
          page,
          size: 10,
          search: searchTerm || undefined,
          status: statusParam,
        },
      });
      return res.data;
    },
  });

  // Create Sale Mutation
  const createSaleMutation = useMutation({
    mutationFn: async () => {
      if (cartItems.length === 0) {
        throw new Error('Adicione pelo menos um produto ao pedido.');
      }
      const payload = {
        customerId: customerId ? Number(customerId) : null,
        paymentMethod,
        notes: notes.trim() || null,
        confirmImmediately,
        discount: Number(generalDiscount) || 0,
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          discount: item.discount,
        })),
      };
      const res = await api.post('/sales', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      handleCloseNewSale();
    },
    onError: (err: any) => {
      setErrorMessage(extractErrorMessage(err, 'Erro ao emitir pedido de venda.'));
    },
  });

  // Confirm Sale Mutation
  const confirmSaleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/sales/${id}/confirm`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      setIsDetailOpen(false);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Erro ao confirmar pedido.');
    },
  });

  // Cancel Sale Mutation
  const cancelSaleMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await api.post(`/sales/${id}/cancel`, { reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      setIsCancelOpen(false);
      setSelectedSale(null);
      setCancelReason('');
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Erro ao cancelar pedido.');
    },
  });

  const handleOpenNewSale = () => {
    setCustomerId('');
    setPaymentMethod('PIX');
    setNotes('');
    setConfirmImmediately(true);
    setCartItems([]);
    setGeneralDiscount('0');
    setSelectedProductInput('');
    setItemQuantityInput('1');
    setItemDiscountInput('0');
    setErrorMessage(null);
    setIsNewSaleOpen(true);
  };

  const handleCloseNewSale = () => {
    setIsNewSaleOpen(false);
    setErrorMessage(null);
  };

  const handleAddItemToCart = () => {
    if (!selectedProductInput) {
      setErrorMessage('Selecione um produto.');
      return;
    }
    const product = products.find((p) => p.id === Number(selectedProductInput));
    if (!product) return;

    const qty = Number(itemQuantityInput);
    if (!qty || qty <= 0) {
      setErrorMessage('Informe uma quantidade válida.');
      return;
    }

    const disc = Number(itemDiscountInput) || 0;
    const sub = qty * product.salePrice - disc;
    if (sub < 0) {
      setErrorMessage('O desconto não pode ser maior que o subtotal do item.');
      return;
    }

    // Check if already in cart
    const existingIndex = cartItems.findIndex((item) => item.productId === product.id);
    if (existingIndex >= 0) {
      const updated = [...cartItems];
      const existing = updated[existingIndex];
      const newQty = existing.quantity + qty;
      const newDisc = existing.discount + disc;
      const newSub = newQty * product.salePrice - newDisc;
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        discount: newDisc,
        subtotal: newSub,
      };
      setCartItems(updated);
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unitPrice: product.salePrice,
          currentStock: product.currentStock,
          quantity: qty,
          discount: disc,
          subtotal: sub,
        },
      ]);
    }

    // Reset item inputs
    setSelectedProductInput('');
    setItemQuantityInput('1');
    setItemDiscountInput('0');
    setErrorMessage(null);
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Totals
  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  const numGeneralDiscount = Number(generalDiscount) || 0;
  const cartTotalAmount = Math.max(0, cartSubtotal - numGeneralDiscount);

  const getStatusBadge = (status: SaleStatus) => {
    switch (status) {
      case 'CONFIRMADA':
        return <Badge variant="success">CONFIRMADA</Badge>;
      case 'ORCAMENTO':
        return <Badge variant="warning">ORÇAMENTO</Badge>;
      case 'CANCELADA':
        return <Badge variant="danger">CANCELADA</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const sales = data?.content || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Vendas & Pedidos (PDV)
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Emissão de orçamentos e pedidos, baixa automática de estoque e integração com contas a receber.
          </p>
        </div>
        <button
          onClick={handleOpenNewSale}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Venda / Orçamento
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por número do pedido ou cliente..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(0);
            }}
            className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todos os status</option>
            <option value="ORCAMENTO">Orçamento</option>
            <option value="CONFIRMADA">Confirmada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-6 py-3 font-semibold">Número</th>
                <th className="px-6 py-3 font-semibold">Data / Hora</th>
                <th className="px-6 py-3 font-semibold">Cliente</th>
                <th className="px-6 py-3 font-semibold">Vendedor</th>
                <th className="px-6 py-3 font-semibold text-center">Itens</th>
                <th className="px-6 py-3 font-semibold">Pagamento</th>
                <th className="px-6 py-3 font-semibold text-right">Valor Total</th>
                <th className="px-6 py-3 font-semibold text-center">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-neutral-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Carregando pedidos de venda...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                    <ShoppingCart className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
                    Nenhum pedido de venda encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-neutral-900 dark:text-neutral-100">
                      {sale.saleNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDateTime(sale.saleDate)}
                    </td>
                    <td className="px-6 py-4">
                      {sale.customerName ? (
                        <div>
                          <div className="font-medium text-neutral-900 dark:text-neutral-100">{sale.customerName}</div>
                          {sale.customerDocument && (
                            <div className="text-xs text-neutral-400">{sale.customerDocument}</div>
                          )}
                        </div>
                      ) : (
                        <span className="italic text-neutral-400">Consumidor Final</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-700 dark:text-neutral-300">
                      {sale.userName}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold">
                      {sale.items?.length || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        <CreditCard className="w-3 h-3 text-neutral-500" />
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-neutral-900 dark:text-neutral-100">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {getStatusBadge(sale.status)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {/* Ver Detalhes */}
                        <button
                          onClick={() => {
                            setSelectedSale(sale);
                            setIsDetailOpen(true);
                          }}
                          className="p-1.5 rounded-md text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          title="Ver detalhes do pedido"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Confirmar Orçamento */}
                        {sale.status === 'ORCAMENTO' && (
                          <button
                            onClick={() => confirmSaleMutation.mutate(sale.id)}
                            disabled={confirmSaleMutation.isPending}
                            className="p-1.5 rounded-md text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="Confirmar e faturar pedido"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Cancelar Venda */}
                        {sale.status !== 'CANCELADA' && (
                          <button
                            onClick={() => {
                              setSelectedSale(sale);
                              setCancelReason('');
                              setErrorMessage(null);
                              setIsCancelOpen(true);
                            }}
                            className="p-1.5 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Cancelar pedido"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
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

      {/* Modal: Nova Venda (PDV) */}
      <Modal
        isOpen={isNewSaleOpen}
        onClose={handleCloseNewSale}
        title="Nova Venda / Emissão de Pedido"
        description="Monte os itens do pedido com cálculo automático de descontos, baixa de estoque e contas a receber."
        maxWidth="lg"
      >
        <div className="space-y-5">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Dados Gerais: Cliente e Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                Cliente (Opcional)
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Consumidor Final (Sem cadastro)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.document ? `(${c.document})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                Forma de Pagamento *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PIX">PIX</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="CARTAO_DEBITO">Cartão de Débito</option>
                <option value="BOLETO">Boleto Bancário</option>
                <option value="A_PRAZO">A Prazo / Crediário</option>
                <option value="TRANSFERENCIA">Transferência Bancária</option>
              </select>
            </div>
          </div>

          {/* Adicionar Produto ao Carrinho */}
          <div className="bg-blue-50/60 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-3">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              Adicionar Produto ao Pedido
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-6">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Produto do Catálogo
                </label>
                <select
                  value={selectedProductInput}
                  onChange={(e) => setSelectedProductInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um produto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (SKU: {p.sku}) — {formatCurrency(p.salePrice)} [Estoque: {p.currentStock} {p.unit}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Qtd
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={itemQuantityInput}
                  onChange={(e) => setItemQuantityInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Desc. (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemDiscountInput}
                  onChange={(e) => setItemDiscountInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddItemToCart}
                  className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Incluir
                </button>
              </div>
            </div>
          </div>

          {/* Carrinho de Itens */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 font-semibold text-xs uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Itens no Pedido ({cartItems.length})
            </div>
            {cartItems.length === 0 ? (
              <div className="py-8 text-center text-sm text-neutral-400">
                Nenhum produto adicionado ainda.
              </div>
            ) : (
              <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
                <thead className="bg-neutral-50 dark:bg-neutral-800/40 text-xs text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="px-4 py-2 font-medium">Produto</th>
                    <th className="px-4 py-2 font-medium text-right">Qtd</th>
                    <th className="px-4 py-2 font-medium text-right">Preço Un.</th>
                    <th className="px-4 py-2 font-medium text-right">Desconto</th>
                    <th className="px-4 py-2 font-medium text-right">Subtotal</th>
                    <th className="px-4 py-2 font-medium text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {cartItems.map((item, index) => (
                    <tr key={index} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20">
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">{item.productName}</div>
                        <div className="text-xs text-neutral-400">SKU: {item.sku} | Estoque Atual: {item.currentStock}</div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">{item.quantity}</td>
                      <td className="px-4 py-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-2.5 text-right text-rose-500">
                        {item.discount > 0 ? `- ${formatCurrency(item.discount)}` : 'R$ 0,00'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(item.subtotal)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveCartItem(index)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Resumo de Valores e Opções */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-neutral-50 dark:bg-neutral-800/30 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Observações do Pedido (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Entregar após as 14h, embalagem reforçada..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmImmediately}
                  onChange={(e) => setConfirmImmediately(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-neutral-300 dark:border-neutral-700"
                />
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Confirmar e faturar imediatamente (baixa estoque e gera título a receber)
                </span>
              </label>
            </div>

            <div className="space-y-2 text-right">
              <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
                <span>Subtotal dos itens:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-neutral-600 dark:text-neutral-400">
                <span>Desconto Geral:</span>
                <div className="w-32">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={generalDiscount}
                    onChange={(e) => setGeneralDiscount(e.target.value)}
                    className="w-full px-2 py-1 text-right text-sm rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex justify-between text-base font-bold text-neutral-900 dark:text-neutral-100">
                <span>Total a Pagar:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-lg">
                  {formatCurrency(cartTotalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Rodapé de Ações */}
          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={handleCloseNewSale}
              className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => createSaleMutation.mutate()}
              disabled={createSaleMutation.isPending || cartItems.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {createSaleMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmImmediately ? 'Emitir e Faturar Venda' : 'Salvar como Orçamento'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Detalhes do Pedido */}
      {selectedSale && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Pedido: ${selectedSale.saleNumber}`}
          description={`Emitido em ${formatDateTime(selectedSale.saleDate)} por ${selectedSale.userName}`}
          maxWidth="lg"
        >
          <div className="space-y-5">
            {/* Resumo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
              <div>
                <span className="block text-xs font-medium text-neutral-500">Status</span>
                <div className="mt-1">{getStatusBadge(selectedSale.status)}</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-neutral-500">Cliente</span>
                <div className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {selectedSale.customerName || 'Consumidor Final'}
                </div>
              </div>
              <div>
                <span className="block text-xs font-medium text-neutral-500">Pagamento</span>
                <div className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {selectedSale.paymentMethod}
                </div>
              </div>
              <div>
                <span className="block text-xs font-medium text-neutral-500">Total Faturado</span>
                <div className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(selectedSale.totalAmount)}
                </div>
              </div>
            </div>

            {selectedSale.cancellationReason && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-sm text-rose-800 dark:text-rose-300">
                <strong>Motivo do Cancelamento:</strong> {selectedSale.cancellationReason}
              </div>
            )}

            {/* Itens */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold uppercase text-neutral-700 dark:text-neutral-300">
                Itens Faturados
              </div>
              <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
                <thead className="bg-neutral-50 dark:bg-neutral-800/40 text-xs text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="px-4 py-2">Produto</th>
                    <th className="px-4 py-2 text-right">Qtd</th>
                    <th className="px-4 py-2 text-right">Preço Unit.</th>
                    <th className="px-4 py-2 text-right">Desconto</th>
                    <th className="px-4 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {selectedSale.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">{item.productName}</div>
                        <div className="text-xs text-neutral-400">SKU: {item.productSku}</div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">{item.quantity} {item.productUnit}</td>
                      <td className="px-4 py-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-2.5 text-right text-rose-500">
                        {item.discount > 0 ? `- ${formatCurrency(item.discount)}` : 'R$ 0,00'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Ações no Rodapé do Detalhe */}
            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              {selectedSale.status === 'ORCAMENTO' && (
                <button
                  type="button"
                  onClick={() => confirmSaleMutation.mutate(selectedSale.id)}
                  disabled={confirmSaleMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirmar e Faturar Agora
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Cancelar Pedido */}
      {selectedSale && (
        <Modal
          isOpen={isCancelOpen}
          onClose={() => setIsCancelOpen(false)}
          title={`Cancelar Pedido: ${selectedSale.saleNumber}`}
          description="Atenção: Ao cancelar um pedido confirmado, os itens voltarão ao estoque e o título financeiro a receber será cancelado automaticamente."
          maxWidth="md"
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
                Motivo / Justificativa do Cancelamento *
              </label>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Informe o motivo detalhado do cancelamento..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsCancelOpen(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!cancelReason.trim()) {
                    setErrorMessage('Informe o motivo do cancelamento.');
                    return;
                  }
                  cancelSaleMutation.mutate({ id: selectedSale.id, reason: cancelReason });
                }}
                disabled={cancelSaleMutation.isPending || !cancelReason.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg transition-colors disabled:opacity-50"
              >
                {cancelSaleMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
