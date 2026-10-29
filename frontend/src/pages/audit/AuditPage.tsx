import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Loader2,
  Lock,
  User,
  Activity,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Pagination } from '../../components/ui/Pagination';
import { formatDateTime } from '../../lib/utils';
import type { AuditLog, PageResponse } from '../../types/models';

export const AuditPage: React.FC = () => {
  const { user } = useAuth();
  const [page, setPage] = useState(0);

  const isAdmin = user?.role === 'ADMIN';

  const { data, isLoading } = useQuery<PageResponse<AuditLog>>({
    queryKey: ['audit-logs', page],
    queryFn: async () => {
      const res = await api.get('/audit', {
        params: { page, size: 20 },
      });
      return res.data;
    },
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-full mb-4">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
          Acesso Restrito ao Administrador
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md mt-2">
          A trilha de auditoria e segurança contém logs de conformidade de todas as transações da empresa e está disponível exclusivamente para usuários com perfil ADMIN.
        </p>
      </div>
    );
  }

  const logs = data?.content || [];

  const getActionBadge = (action: string) => {
    if (action.includes('CRIAR')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
          {action}
        </span>
      );
    }
    if (action.includes('CONFIRMAR')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          {action}
        </span>
      );
    }
    if (action.includes('CANCELAR')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Trilha de Auditoria & Conformidade
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Registro imutável de eventos sensíveis de faturamento, estoque, financeiro e segurança da empresa.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-6 py-3 font-semibold">Data / Hora</th>
                <th className="px-6 py-3 font-semibold">Usuário Responsável</th>
                <th className="px-6 py-3 font-semibold">Ação</th>
                <th className="px-6 py-3 font-semibold">Entidade / ID</th>
                <th className="px-6 py-3 font-semibold">Detalhes Registrados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Carregando eventos de auditoria...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                    <Activity className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
                    Nenhum log de auditoria registrado até o momento.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-neutral-500">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-neutral-400" />
                        {log.userName || 'Sistema'}
                      </div>
                      {log.userEmail && (
                        <div className="text-xs text-neutral-400">{log.userEmail}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">{log.entityName}</span>
                      {log.entityId && (
                        <span className="text-neutral-400 ml-1">#{log.entityId}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-700 dark:text-neutral-300 text-xs">
                      {log.detailsJson || '-'}
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
    </div>
  );
};
