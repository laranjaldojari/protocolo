import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STATUS_LABEL: Record<string, string> = {
  ABERTO: 'Aberto', EM_ANDAMENTO: 'Em andamento', PENDENTE: 'Pendente',
  CONCLUIDO: 'Concluído', ARQUIVADO: 'Arquivado', CANCELADO: 'Cancelado',
};

export const STATUS_COLOR: Record<string, string> = {
  ABERTO: 'bg-blue-100 text-blue-800 border-blue-300',
  EM_ANDAMENTO: 'bg-jari-100 text-jari-800 border-jari-300',
  PENDENTE: 'bg-amber-100 text-amber-800 border-amber-300',
  CONCLUIDO: 'bg-green-100 text-green-800 border-green-300',
  ARQUIVADO: 'bg-gray-100 text-gray-700 border-gray-300',
  CANCELADO: 'bg-red-100 text-red-800 border-red-300',
};

export const MOVEMENT_LABEL: Record<string, string> = {
  ABERTURA: 'Abertura', ENCAMINHAMENTO: 'Encaminhamento', DESPACHO: 'Despacho',
  PENDENCIA: 'Pendência', CONCLUSAO: 'Conclusão', ARQUIVAMENTO: 'Arquivamento',
  CANCELAMENTO: 'Cancelamento', REABERTURA: 'Reabertura',
};

export function formatDate(d: string | Date) {
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
