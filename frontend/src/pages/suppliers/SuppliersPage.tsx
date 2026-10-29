import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Plus, Search, Mail, Phone, Loader2, AlertCircle, Edit, Power } from 'lucide-react';
import api from '../../services/api';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { extractErrorMessage } from '../../lib/utils';
import type { Supplier, PageResponse } from '../../types/models';

export const SuppliersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState<Partial<Supplier>>({
    corporateName: '',
    tradeName: '',
    document: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    notes: '',
    active: true,
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeParam = statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE';

  const { data, isLoading } = useQuery<PageResponse<Supplier>>({
    queryKey: ['suppliers', page, searchTerm, activeParam],
    queryFn: async () => {
      const res = await api.get('/suppliers', {
        params: {
          page,
          size: 10,
          search: searchTerm || undefined,
          active: activeParam,
        },
      });
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<Supplier>) => {
      const cleanPayload = {
        corporateName: payload.corporateName?.trim(),
        tradeName: payload.tradeName?.trim() || null,
        document: payload.document?.trim(),
        email: payload.email?.trim() || null,
        phone: payload.phone?.trim() || null,
        address: payload.address?.trim() || null,
        city: payload.city?.trim() || null,
        state: payload.state?.trim() || null,
        zipCode: payload.zipCode?.trim() || null,
        notes: payload.notes?.trim() || null,
        active: payload.active !== undefined ? Boolean(payload.active) : true,
      };

      if (!cleanPayload.corporateName) {
        throw new Error('A razão social é obrigatória.');
      }
      if (!cleanPayload.document) {
        throw new Error('O documento (CNPJ/CPF) é obrigatório.');
      }

      if (selectedSupplier) {
        const res = await api.put(`/suppliers/${selectedSupplier.id}`, cleanPayload);
        return res.data;
      } else {
        const res = await api.post('/suppliers', cleanPayload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsModalOpen(false);
      setSelectedSupplier(null);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(extractErrorMessage(err, 'Erro ao salvar fornecedor.'));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.patch(`/suppliers/${id}/toggle-status`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Erro ao alterar status.');
    },
  });

  const handleOpenCreate = () => {
    setSelectedSupplier(null);
    setFormData({
      corporateName: '',
      tradeName: '',
      document: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      notes: '',
      active: true,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData(supplier);
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
          <h2 className="text-xl font-bold tracking-tight text-foreground">Fornecedores</h2>
          <p className="text-xs text-muted-foreground">Gestão de distribuidores, indústrias e prestadores parceiros</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Fornecedor</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card border border-border p-3 rounded-xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="text-xs px-2.5 py-1.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todos os Fornecedores</option>
            <option value="ACTIVE">Somente Ativos</option>
            <option value="INACTIVE">Somente Inativos</option>
          </select>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : !data || data.content.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <Truck className="w-8 h-8 mx-auto text-muted-foreground/60" />
            <p className="font-semibold text-foreground">Nenhum fornecedor encontrado</p>
            <p>Cadastre um novo fornecedor para abastecer o catálogo de produtos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Razão Social / Fantasia</th>
                  <th className="py-3 px-4">CNPJ / CPF</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">Localização</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.content.map((s) => (
                  <tr key={s.id} className="hover:bg-accent/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      <div>{s.corporateName}</div>
                      {s.tradeName && <div className="text-[11px] font-normal text-muted-foreground">{s.tradeName}</div>}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                      {s.document}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      <div className="space-y-0.5">
                        {s.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span>{s.email}</span>
                          </div>
                        )}
                        {s.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <span>{s.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {s.city ? `${s.city}/${s.state || ''}` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={s.active ? 'success' : 'danger'}>
                        {s.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          title="Editar Fornecedor"
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleMutation.mutate(s.id)}
                          title={s.active ? 'Inativar Fornecedor' : 'Ativar Fornecedor'}
                          className={`p-1.5 rounded-md transition-colors ${
                            s.active
                              ? 'text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        description="Cadastre parceiros fornecedores e distribuidores da sua empresa"
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
              <label className="font-semibold text-foreground">Razão Social *</label>
              <input
                type="text"
                required
                value={formData.corporateName || ''}
                onChange={(e) => setFormData({ ...formData, corporateName: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Nome Fantasia</label>
              <input
                type="text"
                value={formData.tradeName || ''}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">CNPJ ou CPF *</label>
              <input
                type="text"
                required
                value={formData.document || ''}
                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">E-mail Comercial</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Telefone</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-foreground">Endereço</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Cidade</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">UF</label>
                <input
                  type="text"
                  maxLength={2}
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">CEP</label>
                <input
                  type="text"
                  value={formData.zipCode || ''}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-foreground">Observações</label>
              <textarea
                rows={2}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              <span>{selectedSupplier ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
