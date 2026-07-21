'use client';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowRight, FileSearch, Landmark, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDate, MOVEMENT_LABEL } from '@/lib/utils';

interface PublicProtocol {
  number: string; status: string; createdAt: string;
  subject: { name: string };
  currentDepartment: { name: string; acronym: string };
  movements: { type: string; createdAt: string; fromDepartment?: { acronym: string } | null; toDepartment?: { acronym: string } | null }[];
}

export default function ConsultaPublica() {
  const [numero, setNumero] = useState('');
  const lookup = useMutation({
    mutationFn: async (n: string) => {
      const { data } = await axios.get<PublicProtocol>(
        `${process.env.NEXT_PUBLIC_API_URL}/protocolos/consulta-publica`,
        { params: { numero: n } },
      );
      return data;
    },
  });

  return (
    <main className="min-h-screen">
      <header className="border-b-4 border-rio-500 bg-jari-900 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Landmark className="h-8 w-8 text-rio-500" aria-hidden />
            <div>
              <p className="font-display text-sm font-semibold uppercase tracking-widest text-jari-200">
                Prefeitura Municipal de
              </p>
              <h1 className="font-display text-xl font-bold leading-tight">Laranjal do Jari · Amapá</h1>
            </div>
          </div>
          <Button asChild variant="gold" size="sm">
            <Link href="/login"><LogIn className="h-4 w-4" /> Acesso do servidor</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="font-display text-3xl font-bold text-jari-900">Acompanhe seu protocolo</h2>
        <p className="mt-2 text-jari-700">
          Informe o número recebido no comprovante de abertura para ver a situação atual e a tramitação do seu pedido.
        </p>

        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => { e.preventDefault(); if (numero.trim()) lookup.mutate(numero.trim()); }}
        >
          <Input
            aria-label="Número do protocolo"
            placeholder="Ex.: 000042/2026"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            className="h-12 font-mono text-base tabular-nums"
          />
          <Button type="submit" size="lg" disabled={lookup.isPending}>
            <FileSearch className="h-4 w-4" />
            {lookup.isPending ? 'Consultando…' : 'Consultar'}
          </Button>
        </form>

        {lookup.isError && (
          <p role="alert" className="mt-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            Protocolo não encontrado. Confira o número — o formato é 000000/AAAA — e tente de novo.
          </p>
        )}

        {lookup.data && (
          <Card className="mt-8">
            <CardContent className="pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="carimbo text-base">Nº {lookup.data.number}</span>
                <StatusBadge status={lookup.data.status} />
              </div>
              <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                <div><dt className="font-medium text-jari-600">Assunto</dt><dd>{lookup.data.subject.name}</dd></div>
                <div><dt className="font-medium text-jari-600">Setor atual</dt><dd>{lookup.data.currentDepartment.name}</dd></div>
                <div><dt className="font-medium text-jari-600">Aberto em</dt><dd>{formatDate(lookup.data.createdAt)}</dd></div>
              </dl>

              <h3 className="mt-6 font-display font-semibold">Tramitação</h3>
              <ol className="mt-2 space-y-2 border-l-2 border-jari-200 pl-4">
                {lookup.data.movements.map((m, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{MOVEMENT_LABEL[m.type] ?? m.type}</span>
                    {m.toDepartment && <> <ArrowRight className="inline h-3 w-3" aria-hidden /> {m.toDepartment.acronym}</>}
                    <span className="ml-2 text-jari-500">{formatDate(m.createdAt)}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}
      </section>

      <footer className="border-t border-jari-200 py-6 text-center text-xs text-jari-500">
        Prefeitura Municipal de Laranjal do Jari — Sistema de Protocolo Digital
      </footer>
    </main>
  );
}
