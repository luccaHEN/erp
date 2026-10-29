import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Boxes, Plus, Loader2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { formatDateTime, extractErrorMessage } from '../../lib/utils';
import type { StockMovement, StockMovementType, Product, PageResponse } from '../../types/models';

export const InventoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [page, setPage] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    type: 'ENTRADA' as StockMovementType,
    quantity: '',
    unitCost: '',
    reason: '',
    sourceDocument: '',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load products for dropdown
  const { data: productsPage } = useQuery<PageResponse<Product>>({
    queryKey: ['products-inventory-select'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { size: 100, active: true } });
      return res.data;
    },
  });
  const products = productsPage?.content || [];

  // Movements Query
  const productParam = selectedProductId === 'ALL' ? undefined : Number(selectedProductId);
  const typeParam = selectedType === 'ALL' ? undefined : (selectedType as StockMovementType);

  const { data, isLoading } = useQuery<PageResponse<StockMovement>>({
    queryKey: ['stock-movements', page, productParam, typeParam],
    queryFn: async () => {
      const res = await api.get('/inventory/movements', {
        params: {
          page,
          size: 15,
          productId: productParam,
          type: typeParam,
        },
      });
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const cleanPayload = {
        productId: Number(payload.productId),
        type: payload.type,
        quantity: Number(String(payload.quantity).replace(',', '.')),
        unitCost: payload.unitCost ? Number(String(payload.unitCost).replace(',', '.')) : null,
        reason: payload.reason?.trim() || null,
        sourceDocument: payload.sourceDocument?.trim() || null,
      };

      if (!cleanPayload.productId) {
        throw new Error('Selecione um produto.');
      }
      if (!cleanPayload.quantity || cleanPayload.quantity <= 0) {
        throw new Error('Informe uma quantidade válida superior a zero.');
      }

      const res = await api.post('/inventory/movements', cleanPayload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      setFormData({
        productId: '',
        type: 'ENTRADA',
        quantity: '',
        unitCost: '',
        reason: '',
        sourceDocument: '',
      });
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(extractErrorMessage(err, 'Erro ao registrar movimentação.'));
    },
  });

  const selectedProductInfo = products.find((p) => p.id === Number(formData.productId));

  const getTypeBadge = (type: StockMovementType) => {
    switch (type) {
      case 'ENTRADA':
        return <Badge variant="success">Entrada</Badge>;
      case 'SAIDA':
        return <Badge variant="warning">Saída Manual</Badge>;
      case 'SAIDA_VENDA':
        return <Badge variant="info">Saída Venda</Badge>;
      case 'ESTORNO_VENDA':
        return <Badge variant="purple">Estorno Venda</Badge>;
      case 'AJUSTE_POSITIVO':
        return <Badge variant="success">Ajuste (+)</Badge>;
      case 'AJUSTE_NEGATIVO':
        return <Badge variant="danger">Ajuste (-)</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Controle de Estoque & Movimentações</h2>
          <p className="text-xs text-muted-foreground">Extrato imutável de transações com controle de saldo e rastreabilidade</p>
        </div>
        <button
          onClick={() => {
            setErrorMessage(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova Movimentação</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card border border-border p-3 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Produto:</span>
          <select
            value={selectedProductId}
            onChange={(e) => {
              setSelectedProductId(e.target.value);
              setPage(0);
            }}
            className="w-full text-xs px-2.5 py-1.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todos os Produtos</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku}) — Saldo: {p.currentStock} {p.unit}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Operação:</span>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(0);
            }}
            className="text-xs px-2.5 py-1.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todos os Tipos</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SAIDA">Saída Manual</option>
            <option value="SAIDA_VENDA">Saída por Venda</option>
            <option value="ESTORNO_VENDA">Estorno por Cancelamento</option>
            <option value="AJUSTE_POSITIVO">Ajuste Positivo</option>
            <option value="AJUSTE_NEGATIVO">Ajuste Negativo</option>
          </select>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : !data || data.content.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <Boxes className="w-8 h-8 mx-auto text-muted-foreground/60" />
            <p className="font-semibold text-foreground">Nenhuma movimentação registrada</p>
            <p>Cadastre uma entrada de estoque para iniciar o fluxo de movimentações.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Data & Hora</th>
                  <th className="py-3 px-4">Produto & SKU</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Quantidade</th>
                  <th className="py-3 px-4">Saldo Após</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4">Motivo / Documento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.content.map((m) => (
                  <tr key={m.id} className="hover:bg-accent/40 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                      {formatDateTime(m.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      <div>{m.productName}</div>
                      <div className="text-[11px] font-mono text-muted-foreground font-normal">
                        SKU: {m.productSku}
                      </div>
                    </td>
                    <td className="py-3 px-4">{getTypeBadge(m.type)}</td>
                    <td className="py-3 px-4 font-semibold">
                      <span
                        className={
                          m.type.includes('SAIDA') || m.type === 'AJUSTE_NEGATIVO'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }
                      >
                        {m.type.includes('SAIDA') || m.type === 'AJUSTE_NEGATIVO' ? '-' : '+'}
                        {m.quantity} {m.productUnit}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      {m.balanceAfter} {m.productUnit}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{m.userName}</td>
                    <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                      <div>{m.reason || '-'}</div>
                      {m.sourceDocument && (
                        <div className="text-[10px] text-muted-foreground/80 font-mono">
                          Doc: {m.sourceDocument}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && (
          <Pagination
            currentPage={data.number}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            pageSize={data.size}
            onPageChange={(newPage) => setPage(newPage)}
          />
        )}
      </div>

      {/* Modal Nova Movimentação */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Movimentação de Estoque"
        description="Atualize o saldo de forma controlada garantindo a integridade transacional"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Produto *</label>
              <select
                required
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione o produto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Saldo: {p.currentStock} {p.unit}
                  </option>
                ))}
              </select>
            </div>

            {selectedProductInfo && (
              <div className="p-2.5 bg-muted/60 border border-border rounded-lg flex items-center justify-between">
                <span className="text-muted-foreground">Saldo Atual em Estoque:</span>
                <span className="font-bold text-foreground">
                  {selectedProductInfo.currentStock} {selectedProductInfo.unit}
                </span>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Tipo de Movimentação *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as StockMovementType })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ENTRADA">Entrada de Mercadoria / Compra</option>
                <option value="SAIDA">Saída Manual / Consumo Interno</option>
                <option value="AJUSTE_POSITIVO">Ajuste Positivo (Balanço/Inventário)</option>
                <option value="AJUSTE_NEGATIVO">Ajuste Negativo (Avaria/Perda)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Quantidade *</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  required
                  placeholder="0.000"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Custo Unitário (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Opcional"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Documento de Origem</label>
              <input
                type="text"
                placeholder="Ex: NF-e 1245, Romaneio 88"
                value={formData.sourceDocument}
                onChange={(e) => setFormData({ ...formData, sourceDocument: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Motivo / Justificativa</label>
              <textarea
                rows={2}
                placeholder="Descreva o motivo desta movimentação..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-border text-foreground hover:bg-accent text-xs font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 disabled:opacity-50 transition-colors"
            >
              {saveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirmar Movimentação</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
