'use client';
import { useQuery } from '@tanstack/react-query';
import { FilePlus2, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import type { Department, Protocol } from '@/lib/types';
import { formatDate, STATUS_LABEL } from '@/lib/utils';

export default function ProtocolosPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [page, setPage] = useState(1);

  const setores = useQuery({
    queryKey: ['setores'],
    queryFn: async () => (await api.get<Department[]>('/setores')).data,
  });

  const lista = useQuery({
    queryKey: ['protocolos', { search, status, departmentId, page }],
    queryFn: async () => (await api.get('/protocolos', {
      params: { search: search || undefined, status: status || undefined, departmentId: departmentId || undefined, page },
    })).data,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-jari-900">Protocolos</h1>
        <Button asChild><Link href="/protocolos/novo"><FilePlus2 className="h-4 w-4" /> Novo protocolo</Link></Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 pt-5 sm:grid-cols-[1fr,200px,220px]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-jari-400" aria-hidden />
            <Input
              aria-label="Buscar por número, descrição ou requerente"
              placeholder="Número, descrição, requerente ou CPF/CNPJ"
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select aria-label="Filtrar por situação" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Todas as situações</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select aria-label="Filtrar por setor" value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }}>
            <option value="">Todos os setores</option>
            {setores.data?.map((s) => <option key={s.id} value={s.id}>{s.acronym} — {s.name}</option>)}
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          {lista.isLoading && <p className="py-8 text-center text-sm text-jari-500">Carregando protocolos…</p>}
          {lista.data && (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-jari-200 text-left text-xs uppercase tracking-wide text-jari-500">
                    <th className="py-2 pr-3">Número</th>
                    <th className="py-2 pr-3">Assunto / Requerente</th>
                    <th className="py-2 pr-3">Setor atual</th>
                    <th className="py-2 pr-3">Abertura</th>
                    <th className="py-2">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-jari-100">
                  {lista.data.items.map((p: Protocol) => (
                    <tr key={p.id} className="hover:bg-jari-50">
                      <td className="py-2.5 pr-3">
                        <Link href={`/protocolos/${p.id}`} className="carimbo hover:border-rio-600">{p.number}</Link>
                      </td>
                      <td className="max-w-[280px] truncate py-2.5 pr-3">
                        <span className="font-medium">{p.subject.name}</span>
                        <span className="block text-xs text-jari-500">{p.applicant.name}</span>
                      </td>
                      <td className="py-2.5 pr-3">{p.currentDepartment.acronym}</td>
                      <td className="py-2.5 pr-3 text-jari-600">{formatDate(p.createdAt)}</td>
                      <td className="py-2.5"><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {lista.data.items.length === 0 && (
                <p className="py-8 text-center text-sm text-jari-500">Nenhum protocolo encontrado com esses filtros.</p>
              )}
              {lista.data.pages > 1 && (
                <div className="mt-4 flex items-center justify-end gap-2 text-sm">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                  <span className="tabular-nums">{page} / {lista.data.pages}</span>
                  <Button variant="outline" size="sm" disabled={page >= lista.data.pages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
