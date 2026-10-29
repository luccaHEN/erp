import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Search, Shield, User, Loader2, AlertCircle, Edit, Power } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { formatDate, extractErrorMessage } from '../../lib/utils';
import type { UserItem } from '../../types/models';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const [createData, setCreateData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'OPERADOR',
  });

  const [editData, setEditData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'OPERADOR',
    active: true,
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery<UserItem[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof createData) => {
      const payload = {
        name: data.name?.trim(),
        email: data.email?.trim(),
        password: data.password,
        role: data.role,
      };
      const res = await api.post('/users', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateOpen(false);
      setCreateData({ name: '', email: '', password: '', role: 'OPERADOR' });
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(extractErrorMessage(err, 'Erro ao cadastrar usuário.'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof editData) => {
      if (!selectedUser) return;
      const payload: any = {
        name: data.name?.trim(),
        email: data.email?.trim(),
        role: data.role,
        active: data.active,
      };
      if (data.password && data.password.trim().length > 0) {
        payload.password = data.password.trim();
      }
      const res = await api.put(`/users/${selectedUser.id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditOpen(false);
      setSelectedUser(null);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(extractErrorMessage(err, 'Erro ao atualizar usuário.'));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.patch(`/users/${id}/toggle-status`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Não foi possível alterar o status do usuário.');
    },
  });

  const handleOpenEdit = (user: UserItem) => {
    setSelectedUser(user);
    setEditData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      active: user.active,
    });
    setErrorMessage(null);
    setIsEditOpen(true);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Controle de Usuários</h2>
          <p className="text-xs text-muted-foreground">Gestão de colaboradores, perfis de acesso e credenciais</p>
        </div>
        <button
          onClick={() => {
            setErrorMessage(null);
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card border border-border p-3 rounded-xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Perfil:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todos os Perfis</option>
            <option value="ADMIN">ADMIN</option>
            <option value="OPERADOR">OPERADOR</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <Users className="w-8 h-8 mx-auto text-muted-foreground/60" />
            <p className="font-semibold text-foreground">Nenhum usuário encontrado</p>
            <p>Tente ajustar os filtros de busca ou cadastre um novo colaborador.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Nome & Identificação</th>
                  <th className="py-3 px-4">E-mail</th>
                  <th className="py-3 px-4">Perfil</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Criado em</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-accent/40 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px]">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold">{u.name}</span>
                            {isCurrent && (
                              <span className="ml-1.5 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.2 rounded font-medium">
                                Você
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                      <td className="py-3 px-4">
                        <Badge variant={u.role === 'ADMIN' ? 'purple' : 'info'}>
                          {u.role === 'ADMIN' ? (
                            <Shield className="w-3 h-3 mr-1" />
                          ) : (
                            <User className="w-3 h-3 mr-1" />
                          )}
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={u.active ? 'success' : 'danger'}>
                          {u.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{formatDate(u.createdAt)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            title="Editar Dados"
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {!isCurrent && (
                            <button
                              onClick={() => toggleMutation.mutate(u.id)}
                              title={u.active ? 'Desativar Usuário' : 'Ativar Usuário'}
                              className={`p-1.5 rounded-md transition-colors ${
                                u.active
                                  ? 'text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                  : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Cadastrar Novo Usuário"
        description="Preencha os dados do colaborador para acesso ao ERP Flow"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(createData);
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
              <label className="font-semibold text-foreground">Nome Completo *</label>
              <input
                type="text"
                required
                placeholder="Ex: João da Silva"
                value={createData.name}
                onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">E-mail Corporativo *</label>
              <input
                type="email"
                required
                placeholder="joao@empresa.com"
                value={createData.email}
                onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Senha Inicial *</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={createData.password}
                onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Perfil de Acesso *</label>
              <select
                value={createData.role}
                onChange={(e) => setCreateData({ ...createData, role: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="OPERADOR">OPERADOR (Vendas, Clientes, Estoque e Financeiro)</option>
                <option value="ADMIN">ADMIN (Acesso Total + Gestão de Usuários e Auditoria)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-border text-foreground hover:bg-accent text-xs font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Criar Usuário</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Editar Usuário"
        description="Atualize as informações cadastrais e permissões do usuário"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate(editData);
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
              <label className="font-semibold text-foreground">Nome Completo *</label>
              <input
                type="text"
                required
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">E-mail Corporativo *</label>
              <input
                type="email"
                required
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Nova Senha (deixe em branco para não alterar)</label>
              <input
                type="password"
                minLength={6}
                placeholder="••••••••"
                value={editData.password}
                onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Perfil de Acesso *</label>
              <select
                value={editData.role}
                onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                disabled={selectedUser?.id === currentUser?.id}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="OPERADOR">OPERADOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
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
