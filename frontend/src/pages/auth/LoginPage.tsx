import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TrendingUp, Lock, Mail, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { LoginResponse } from '../../types/auth';

const loginSchema = z.object({
  email: z.string().min(1, 'O e-mail é obrigatório').email('Formato de e-mail inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    try {
      const response = await api.post<LoginResponse>('/auth/login', data);
      login(response.data);
      navigate('/');
    } catch (err: any) {
      if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage('Não foi possível conectar ao servidor. Verifique se o backend está em execução.');
      }
    }
  };

  const handleFillDemo = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 mb-2">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">ERP Flow</h2>
          <p className="text-sm text-muted-foreground">Sistema Integrado de Gestão Empresarial</p>
        </div>

        {/* Card Form */}
        <div className="bg-card border border-border shadow-sm rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">Acesse sua conta</h3>
            <p className="text-xs text-muted-foreground">Insira suas credenciais para gerenciar sua empresa</p>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="seu.email@empresa.com"
                  {...register('email')}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full pl-9 pr-10 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>Entrar no Sistema</span>
              )}
            </button>
          </form>

          {/* Demo Credentials Box */}
          <div className="pt-4 border-t border-border space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block text-center">
              Acesso Rápido para Demonstração
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('admin@erpflow.com', 'admin123')}
                className="p-2 border border-border hover:bg-accent rounded-lg text-left text-xs transition-colors"
              >
                <div className="font-semibold text-foreground">Admin</div>
                <div className="text-[11px] text-muted-foreground truncate">admin@erpflow.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('operador@erpflow.com', 'operador123')}
                className="p-2 border border-border hover:bg-accent rounded-lg text-left text-xs transition-colors"
              >
                <div className="font-semibold text-foreground">Operador</div>
                <div className="text-[11px] text-muted-foreground truncate">operador@erpflow.com</div>
              </button>
            </div>
          </div>
        </div>

        {/* System Footnote */}
        <p className="text-center text-xs text-muted-foreground">
          ERP Flow &bull; Arquitetura Monolítica Modular em Java 21 & React
        </p>
      </div>
    </div>
  );
};
