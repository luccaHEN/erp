import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus, Loader2, AlertCircle, Edit, Power } from 'lucide-react';
import api from '../../services/api';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { formatDate, extractErrorMessage } from '../../lib/utils';
import type { Category } from '../../types/models';

export const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true,
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const cleanPayload = {
        name: payload.name?.trim(),
        description: payload.description?.trim() || null,
        active: payload.active !== undefined ? Boolean(payload.active) : true,
      };

      if (!cleanPayload.name) {
        throw new Error('O nome da categoria é obrigatório.');
      }

      if (selectedCategory) {
        const res = await api.put(`/categories/${selectedCategory.id}`, cleanPayload);
        return res.data;
      } else {
        const res = await api.post('/categories', cleanPayload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsModalOpen(false);
      setSelectedCategory(null);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(extractErrorMessage(err, 'Erro ao salvar categoria.'));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.patch(`/categories/${id}/toggle-status`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Erro ao alterar status.');
    },
  });

  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setFormData({ name: '', description: '', active: true });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      active: category.active,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Categorias de Produtos</h2>
          <p className="text-xs text-muted-foreground">Classificação mercadológica para organizar o catálogo</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Grid or Table of Categories */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <Layers className="w-8 h-8 mx-auto text-muted-foreground/60" />
            <p className="font-semibold text-foreground">Nenhuma categoria cadastrada</p>
            <p>Cadastre categorias para organizar e filtrar seus produtos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Nome da Categoria</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Criada em</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-accent/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <span>{cat.name}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {cat.description || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={cat.active ? 'success' : 'danger'}>
                        {cat.active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{formatDate(cat.createdAt)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          title="Editar Categoria"
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleMutation.mutate(cat.id)}
                          title={cat.active ? 'Inativar Categoria' : 'Ativar Categoria'}
                          className={`p-1.5 rounded-md transition-colors ${
                            cat.active
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
      </div>

      {/* Modal Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCategory ? 'Editar Categoria' : 'Nova Categoria'}
        description="Defina a classificação para agrupamento de produtos"
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
              <label className="font-semibold text-foreground">Nome da Categoria *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Descrição</label>
              <textarea
                rows={3}
                value={formData.description}
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
              <span>{selectedCategory ? 'Salvar Alterações' : 'Criar Categoria'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
