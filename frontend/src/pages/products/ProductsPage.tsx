import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Search, AlertTriangle, Loader2, AlertCircle, Edit, Power, Layers } from 'lucide-react';
import api from '../../services/api';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { formatCurrency, extractErrorMessage } from '../../lib/utils';
import type { Product, Category, Supplier, PageResponse } from '../../types/models';

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [lowStockFilter, setLowStockFilter] = useState<boolean>(false);
  const [page, setPage] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState<any>({
    name: '',
    sku: '',
    description: '',
    unit: 'UN',
    categoryId: undefined,
    supplierId: undefined,
    costPrice: 0,
    salePrice: 0,
    minStock: 0,
    active: true,
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Queries for Select Dropdowns
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories-select'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });

  const { data: suppliersPage } = useQuery<PageResponse<Supplier>>({
    queryKey: ['suppliers-select'],
    queryFn: async () => {
      const res = await api.get('/suppliers', { params: { size: 100, active: true } });
      return res.data;
    },
  });
  const suppliers = suppliersPage?.content || [];

  // Main Products Query
  const activeParam = statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE';
  const categoryIdParam = categoryFilter === 'ALL' ? undefined : Number(categoryFilter);

  const { data, isLoading } = useQuery<PageResponse<Product>>({
    queryKey: ['products', page, searchTerm, categoryIdParam, activeParam, lowStockFilter],
    queryFn: async () => {
      const res = await api.get('/products', {
        params: {
          page,
          size: 10,
          search: searchTerm || undefined,
          categoryId: categoryIdParam,
          active: activeParam,
          lowStock: lowStockFilter ? true : undefined,
        },
      });
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const parseNum = (val: any) => {
        if (val === undefined || val === null || val === '') return 0;
        const cleaned = String(val).replace(',', '.');
        const num = Number(cleaned);
        return isNaN(num) ? 0 : num;
      };

      const cleanPayload = {
        name: payload.name ? String(payload.name).trim() : '',
        sku: payload.sku ? String(payload.sku).trim() : '',
        description: payload.description ? String(payload.description).trim() : null,
        unit: payload.unit ? String(payload.unit).trim() : 'UN',
        categoryId: payload.categoryId && payload.categoryId !== '' ? Number(payload.categoryId) : null,
        supplierId: payload.supplierId && payload.supplierId !== '' ? Number(payload.supplierId) : null,
        costPrice: parseNum(payload.costPrice),
        salePrice: parseNum(payload.salePrice),
        minStock: parseNum(payload.minStock),
        active: payload.active !== undefined ? Boolean(payload.active) : true,
      };

      if (!cleanPayload.name) {
        throw new Error('O nome do produto é obrigatório.');
      }
      if (!cleanPayload.sku) {
        throw new Error('O SKU do produto é obrigatório.');
      }

      if (selectedProduct) {
        const res = await api.put(`/products/${selectedProduct.id}`, cleanPayload);
        return res.data;
      } else {
        const res = await api.post('/products', cleanPayload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      setSelectedProduct(null);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(extractErrorMessage(err, 'Erro ao salvar produto.'));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.patch(`/products/${id}/toggle-status`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Erro ao alterar status.');
    },
  });

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setFormData({
      name: '',
      sku: '',
      description: '',
      unit: 'UN',
      categoryId: '',
      supplierId: '',
      costPrice: 0,
      salePrice: 0,
      minStock: 0,
      active: true,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      unit: product.unit,
      categoryId: product.categoryId || '',
      supplierId: product.supplierId || '',
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      minStock: product.minStock,
      active: product.active,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Catálogo de Produtos</h2>
          <p className="text-xs text-muted-foreground">Gestão de itens, precificação, custos e monitoramento de estoque</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-3 bg-card border border-border p-3 rounded-xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome ou SKU..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(0);
            }}
            className="text-xs px-2.5 py-1.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="text-xs px-2.5 py-1.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ACTIVE">Somente Ativos</option>
            <option value="INACTIVE">Somente Inativos</option>
          </select>

          {/* Low Stock Toggle */}
          <button
            type="button"
            onClick={() => {
              setLowStockFilter(!lowStockFilter);
              setPage(0);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              lowStockFilter
                ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400'
                : 'bg-background border-input text-muted-foreground hover:text-foreground'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Estoque Baixo</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : !data || data.content.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <Package className="w-8 h-8 mx-auto text-muted-foreground/60" />
            <p className="font-semibold text-foreground">Nenhum produto encontrado</p>
            <p>Cadastre um novo item ou altere os filtros selecionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Produto & SKU</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Preço Custo</th>
                  <th className="py-3 px-4">Preço Venda</th>
                  <th className="py-3 px-4">Margem</th>
                  <th className="py-3 px-4">Estoque Atual / Mín.</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.content.map((p) => {
                  const margin =
                    p.salePrice > 0
                      ? (((p.salePrice - p.costPrice) / p.salePrice) * 100).toFixed(1)
                      : '0.0';

                  return (
                    <tr key={p.id} className="hover:bg-accent/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        <div>{p.name}</div>
                        <div className="text-[11px] font-mono text-muted-foreground font-normal">
                          SKU: {p.sku} &bull; Unidade: {p.unit}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {p.categoryName ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-[11px] font-medium text-foreground">
                            <Layers className="w-3 h-3 text-muted-foreground" />
                            {p.categoryName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">Sem categoria</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{formatCurrency(p.costPrice)}</td>
                      <td className="py-3 px-4 font-semibold text-foreground">{formatCurrency(p.salePrice)}</td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                          {margin}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {p.lowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            {p.currentStock} / mín. {p.minStock} {p.unit}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                            {p.currentStock} {p.unit}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={p.active ? 'success' : 'danger'}>
                          {p.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Editar Produto"
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleMutation.mutate(p.id)}
                            title={p.active ? 'Inativar Produto' : 'Ativar Produto'}
                            className={`p-1.5 rounded-md transition-colors ${
                              p.active
                                ? 'text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedProduct ? 'Editar Produto' : 'Novo Produto'}
        description="Cadastre produtos com controle de estoque mínimo e SKU único por empresa"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-foreground">Nome do Produto *</label>
              <input
                type="text"
                required
                placeholder="Ex: Teclado Mecânico RGB"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">SKU / Código Interno *</label>
              <input
                type="text"
                required
                placeholder="Ex: TEC-MEC-001"
                value={formData.sku || ''}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Unidade de Medida *</label>
              <select
                value={formData.unit || 'UN'}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UN">UN (Unidade)</option>
                <option value="CX">CX (Caixa)</option>
                <option value="KG">KG (Quilograma)</option>
                <option value="LT">LT (Litro)</option>
                <option value="MT">MT (Metro)</option>
                <option value="PC">PC (Peça)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Categoria</label>
              <select
                value={formData.categoryId || ''}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione uma Categoria...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Fornecedor Preferencial</label>
              <select
                value={formData.supplierId || ''}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um Fornecedor...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.tradeName || s.corporateName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Preço de Custo (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Preço de Venda (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-foreground">Estoque Mínimo de Alerta *</label>
              <input
                type="number"
                step="0.001"
                min="0"
                required
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-muted-foreground mt-0.5">
                O sistema emitirá avisos automáticos no Dashboard quando o saldo atingir ou ficar abaixo deste valor.
              </p>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-foreground">Descrição Detalhada</label>
              <textarea
                rows={2}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              <span>{selectedProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
