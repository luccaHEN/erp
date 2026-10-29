import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function extractErrorMessage(err: any, fallback = 'Ocorreu um erro ao processar a solicitação.'): string {
  if (!err) return fallback;
  if (err.response?.data?.fieldErrors && typeof err.response.data.fieldErrors === 'object') {
    const messages = Object.values(err.response.data.fieldErrors).filter(Boolean);
    if (messages.length > 0) {
      return messages.join('. ');
    }
  }
  return err.response?.data?.message || err.message || fallback;
}
