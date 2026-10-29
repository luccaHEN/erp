import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Mail, Phone, MapPin, CheckCircle2, Edit2, Loader2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { formatDate, extractErrorMessage } from '../../lib/utils';
import type { Company } from '../../types/models';

export const CompanyPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Company>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: company, isLoading } = useQuery<Company>({
    queryKey: ['company-current'],
    queryFn: async () => {
      const res = await api.get('/companies/current');
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Company>) => {
      const cleanData = {
        corporateName: data.corporateName?.trim(),
        tradeName: data.tradeName?.trim() || null,
        cnpj: data.cnpj?.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        zipCode: data.zipCode?.trim() || null,
      };
      const res = await api.put(`/companies/${company?.id}`, cleanData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-current'] });
      setIsEditOpen(false);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(extractErrorMessage(err, 'Erro ao atualizar dados da empresa.'));
    },
  });

  const handleOpenEdit = () => {
    if (company) {
      setFormData(company);
      setErrorMessage(null);
      setIsEditOpen(true);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Dados da Empresa</h2>
          <p className="text-xs text-muted-foreground">Configurações cadastrais e informações fiscais da sua organização</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenEdit}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Editar Cadastro</span>
          </button>
        )}
      </div>

      {company && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <div className="md:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{company.tradeName}</h3>
                  <p className="text-xs text-muted-foreground">{company.corporateName}</p>
                </div>
              </div>
              <Badge variant={company.active ? 'success' : 'danger'}>
                {company.active ? 'Empresa Ativa' : 'Inativa'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">CNPJ</span>
                <p className="font-semibold text-foreground text-sm">{company.cnpj}</p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">Data de Cadastro</span>
                <p className="font-semibold text-foreground text-sm">{formatDate(company.createdAt)}</p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">E-mail de Contato</span>
                <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  {company.email || 'Não informado'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">Telefone / WhatsApp</span>
                <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  {company.phone || 'Não informado'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground font-medium block mb-1">Endereço Principal</span>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                {company.address ? `${company.address}, ${company.city} - ${company.state}, CEP: ${company.zipCode}` : 'Endereço não cadastrado'}
              </p>
            </div>
          </div>

          {/* Multitenancy Security Notice */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              Isolamento Multitenant Ativo
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Todos os registros do ERP Flow (clientes, fornecedores, produtos, movimentações de estoque, vendas e financeiro) são rigorosamente isolados para a empresa <strong>ID #{company.id}</strong>.
            </p>
            <div className="p-3 bg-muted rounded-lg text-[11px] text-muted-foreground space-y-1">
              <div><strong>Segurança de Dados:</strong> Validação em camada de serviço.</div>
              <div><strong>Auditoria:</strong> Operações rastreadas por tenant.</div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Editar Dados da Empresa"
        description="Atualize as informações corporativas e de contato da sua organização"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
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
              <label className="font-semibold text-foreground">Nome Fantasia *</label>
              <input
                type="text"
                required
                value={formData.tradeName || ''}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">CNPJ *</label>
              <input
                type="text"
                required
                value={formData.cnpj || ''}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">E-mail</label>
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
              <label className="font-semibold text-foreground">Endereço Completo</label>
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
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 border border-border text-foreground hover:bg-accent text-xs font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 disabled:opacity-50 transition-colors"
            >
              {updateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
