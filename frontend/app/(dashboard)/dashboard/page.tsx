'use client';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock4, FolderOpen, Hourglass, Sigma } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import type { Protocol } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const stats = useQuery({
    queryKey: ['stats'],
    queryFn: async () => (await api.get('/protocolos/estatisticas')).data,
  });
  const recentes = useQuery({
    queryKey: ['protocolos', 'recentes'],
    queryFn: async () => (await api.get('/protocolos', { params: { page: 1 } })).data,
  });

  const cards = [
    { label: 'Abertos', value: stats.data?.abertos, icon: FolderOpen, color: 'text-blue-700' },
    { label: 'Em andamento', value: stats.data?.andamento, icon: Clock4, color: 'text-jari-700' },
    { label: 'Pendentes', value: stats.data?.pendentes, icon: Hourglass, color: 'text-amber-700' },
    { label: 'Concluídos', value: stats.data?.concluidos, icon: CheckCircle2, color: 'text-green-700' },
    { label: 'Total', value: stats.data?.total, icon: Sigma, color: 'text-jari-900' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-jari-900">Painel</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-5">
              <c.icon className={`h-5 w-5 ${c.color}`} aria-hidden />
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{c.value ?? '—'}</p>
              <p className="text-sm text-jari-600">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Últimos protocolos</CardTitle></CardHeader>
        <CardContent>
          {recentes.data?.items?.length ? (
            <ul className="divide-y divide-jari-100">
              {recentes.data.items.slice(0, 8).map((p: Protocol) => (
                <li key={p.id}>
                  <Link href={`/protocolos/${p.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 hover:bg-jari-50">
                    <span className="carimbo">{p.number}</span>
                    <span className="flex-1 truncate px-3 text-sm">{p.subject.name} — {p.applicant.name}</span>
                    <span className="text-xs text-jari-500">{formatDate(p.createdAt)}</span>
                    <StatusBadge status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-jari-500">
              Nenhum protocolo ainda. Abra o primeiro em “Novo protocolo”.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
