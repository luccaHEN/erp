import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCheck, UserPlus, Search, Mail, Phone, Loader2, AlertCircle, Edit, Power, Eye } from 'lucide-react';
import api from '../../services/api';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { formatDate, extractErrorMessage } from '../../lib/utils';
import type { Customer, PageResponse } from '../../types/models';

export const CustomersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
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

  const { data, isLoading } = useQuery<PageResponse<Customer>>({
    queryKey: ['customers', page, searchTerm, activeParam],
    queryFn: async () => {
      const res = await api.get('/customers', {
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
    mutationFn: async (payload: Partial<Customer>) => {
      const cleanPayload = {
        name: payload.name?.trim(),
        document: payload.document?.trim() || null,
        email: payload.email?.trim() || null,
        phone: payload.phone?.trim() || null,
        address: payload.address?.trim() || null,
        city: payload.city?.trim() || null,
        state: payload.state?.trim() || null,
        zipCode: payload.zipCode?.trim() || null,
        notes: payload.notes?.trim() || null,
        active: payload.active !== undefined ? Boolean(payload.active) : true,
      };

      if (!cleanPayload.name) {
        throw new Error('O nome do cliente é obrigatório.');
      }

      if (selectedCustomer) {
        const res = await api.put(`/customers/${selectedCustomer.id}`, cleanPayload);
        return res.data;
      } else {
        const res = await api.post('/customers', cleanPayload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsModalOpen(false);
      setSelectedCustomer(null);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(extractErrorMessage(err, 'Erro ao salvar cliente.'));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.patch(`/customers/${id}/toggle-status`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Erro ao alterar status.');
    },
  });

  const handleOpenCreate = () => {
    setSelectedCustomer(null);
    setFormData({
      name: '',
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

  const handleOpenEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(customer);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailsOpen(true);
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
          <h2 className="text-xl font-bold tracking-tight text-foreground">Carteira de Clientes</h2>
          <p className="text-xs text-muted-foreground">Cadastro e controle de consumidores e clientes corporativos</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card border border-border p-3 rounded-xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF/CNPJ..."
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
            <option value="ALL">Todos os Clientes</option>
            <option value="ACTIVE">Somente Ativos</option>
            <option value="INACTIVE">Somente Inativos</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : !data || data.content.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <UserCheck className="w-8 h-8 mx-auto text-muted-foreground/60" />
            <p className="font-semibold text-foreground">Nenhum cliente encontrado</p>
            <p>Cadastre um novo cliente ou redefina os termos de busca.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Nome / Razão Social</th>
                  <th className="py-3 px-4">Documento (CPF/CNPJ)</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">Cidade / UF</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.content.map((c) => (
                  <tr key={c.id} className="hover:bg-accent/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                      {c.document || 'Não informado'}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      <div className="space-y-0.5">
                        {c.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span>{c.email}</span>
                          </div>
                        )}
                        {c.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {c.city ? `${c.city}/${c.state || ''}` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={c.active ? 'success' : 'danger'}>
                        {c.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenDetails(c)}
                          title="Visualizar Detalhes"
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          title="Editar Cadastro"
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleMutation.mutate(c.id)}
                          title={c.active ? 'Inativar Cliente' : 'Ativar Cliente'}
                          className={`p-1.5 rounded-md transition-colors ${
                            c.active
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
        title={selectedCustomer ? 'Editar Cliente' : 'Novo Cliente'}
        description="Preencha os dados do cliente respeitando a unicidade de documento por empresa"
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
              <label className="font-semibold text-foreground">Nome Completo / Razão Social *</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">CPF ou CNPJ</label>
              <input
                type="text"
                placeholder="000.000.000-00 ou 00.000.000/0001-00"
                value={formData.document || ''}
                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Telefone / WhatsApp</label>
              <input
                type="text"
                placeholder="(00) 00000-0000"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-foreground">E-mail</label>
              <input
                type="email"
                placeholder="cliente@email.com"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-foreground">Endereço (Rua, Número, Bairro)</label>
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
              <label className="font-semibold text-foreground">Observações Internas</label>
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
              <span>{selectedCustomer ? 'Salvar Alterações' : 'Cadastrar Cliente'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={`Ficha de Cadastro: ${selectedCustomer.name}`}
          description={`Código #${selectedCustomer.id} • Cadastrado em ${formatDate(selectedCustomer.createdAt)}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 bg-muted/40 rounded-xl">
              <div>
                <span className="text-muted-foreground block">Documento:</span>
                <span className="font-semibold text-foreground">{selectedCustomer.document || 'Não informado'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Situação:</span>
                <Badge variant={selectedCustomer.active ? 'success' : 'danger'}>
                  {selectedCustomer.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground block">E-mail:</span>
                <span className="font-semibold text-foreground">{selectedCustomer.email || 'Não informado'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Telefone:</span>
                <span className="font-semibold text-foreground">{selectedCustomer.phone || 'Não informado'}</span>
              </div>
            </div>

            {selectedCustomer.address && (
              <div className="p-3 border border-border rounded-xl">
                <span className="text-muted-foreground font-semibold block mb-1">Localização</span>
                <p className="text-foreground">
                  {selectedCustomer.address}, {selectedCustomer.city} - {selectedCustomer.state}, CEP: {selectedCustomer.zipCode}
                </p>
              </div>
            )}

            {selectedCustomer.notes && (
              <div className="p-3 border border-border rounded-xl">
                <span className="text-muted-foreground font-semibold block mb-1">Observações</span>
                <p className="text-foreground">{selectedCustomer.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2 bg-accent hover:bg-accent/80 text-foreground font-semibold rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
