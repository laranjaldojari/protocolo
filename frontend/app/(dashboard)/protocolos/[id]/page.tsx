'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Download, FileText, Paperclip, Printer, Send, Upload } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import type { Department, Protocol } from '@/lib/types';
import { formatDate, MOVEMENT_LABEL } from '@/lib/utils';

const DESPACHOS = [
  { value: 'DESPACHO', label: 'Registrar despacho' },
  { value: 'PENDENCIA', label: 'Marcar pendência' },
  { value: 'CONCLUSAO', label: 'Concluir' },
  { value: 'ARQUIVAMENTO', label: 'Arquivar' },
  { value: 'CANCELAMENTO', label: 'Cancelar' },
  { value: 'REABERTURA', label: 'Reabrir' },
];

export default function ProtocoloDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const [toDept, setToDept] = useState('');
  const [forwardNote, setForwardNote] = useState('');
  const [dispatchType, setDispatchType] = useState('DESPACHO');
  const [dispatchNote, setDispatchNote] = useState('');

  const protocolo = useQuery({
    queryKey: ['protocolo', id],
    queryFn: async () => (await api.get<Protocol>(`/protocolos/${id}`)).data,
  });
  const setores = useQuery({
    queryKey: ['setores'],
    queryFn: async () => (await api.get<Department[]>('/setores')).data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['protocolo', id] });

  const encaminhar = useMutation({
    mutationFn: async () =>
      (await api.patch(`/protocolos/${id}/encaminhar`, { toDepartmentId: toDept, note: forwardNote || undefined })).data,
    onSuccess: () => { setToDept(''); setForwardNote(''); invalidate(); },
  });

  const despachar = useMutation({
    mutationFn: async () =>
      (await api.patch(`/protocolos/${id}/despachar`, { type: dispatchType, note: dispatchNote || undefined })).data,
    onSuccess: () => { setDispatchNote(''); invalidate(); },
  });

  const enviarAnexo = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return (await api.post(`/protocolos/${id}/anexos`, form)).data;
    },
    onSuccess: invalidate,
  });

  async function baixarComprovante() {
    const res = await api.get(`/protocolos/${id}/comprovante.pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    window.open(url, '_blank');
  }

  async function baixarAnexo(attId: string, name: string) {
    const res = await api.get(`/protocolos/${id}/anexos/${attId}/download`, { responseType: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(res.data);
    a.download = name;
    a.click();
  }

  if (protocolo.isLoading) return <p className="py-10 text-center text-sm text-jari-500">Carregando protocolo…</p>;
  if (!protocolo.data) return <p className="py-10 text-center text-sm text-red-700">Protocolo não encontrado.</p>;
  const p = protocolo.data;
  const encerrado = ['CONCLUIDO', 'ARQUIVADO', 'CANCELADO'].includes(p.status);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="carimbo text-lg">Nº {p.number}</span>
          <StatusBadge status={p.status} />
        </div>
        <Button variant="outline" onClick={baixarComprovante}>
          <Printer className="h-4 w-4" /> Comprovante em PDF
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr,1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Dados do protocolo</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                <div><dt className="font-medium text-jari-600">Assunto</dt><dd>{p.subject.name}</dd></div>
                <div><dt className="font-medium text-jari-600">Setor atual</dt><dd>{p.currentDepartment.name} ({p.currentDepartment.acronym})</dd></div>
                <div><dt className="font-medium text-jari-600">Requerente</dt><dd>{p.applicant.name}</dd></div>
                <div><dt className="font-medium text-jari-600">CPF/CNPJ</dt><dd className="tabular-nums">{p.applicant.document}</dd></div>
                <div><dt className="font-medium text-jari-600">Aberto em</dt><dd>{formatDate(p.createdAt)}</dd></div>
                <div><dt className="font-medium text-jari-600">Aberto por</dt><dd>{p.createdBy?.name}</dd></div>
              </dl>
              <p className="mt-4 rounded-md bg-jari-50 p-3 text-sm">{p.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Tramitação</CardTitle></CardHeader>
            <CardContent>
              <ol className="space-y-3 border-l-2 border-jari-200 pl-4">
                {p.movements?.map((m) => (
                  <li key={m.id} className="relative text-sm">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-jari-600" aria-hidden />
                    <p>
                      <span className="font-semibold">{MOVEMENT_LABEL[m.type] ?? m.type}</span>
                      {m.fromDepartment && <> · {m.fromDepartment.acronym}</>}
                      {m.toDepartment && <> <ArrowRight className="inline h-3 w-3" aria-hidden /> {m.toDepartment.acronym}</>}
                    </p>
                    {m.note && <p className="text-jari-700">{m.note}</p>}
                    <p className="text-xs text-jari-500">{m.sentBy?.name} · {formatDate(m.createdAt)}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Encaminhar</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="toDept">Setor de destino</Label>
                <Select id="toDept" value={toDept} onChange={(e) => setToDept(e.target.value)} disabled={encerrado}>
                  <option value="">Selecione…</option>
                  {setores.data?.filter((s) => s.id !== p.currentDepartment.id)
                    .map((s) => <option key={s.id} value={s.id}>{s.acronym} — {s.name}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="forwardNote">Despacho (opcional)</Label>
                <Textarea id="forwardNote" rows={2} value={forwardNote}
                  onChange={(e) => setForwardNote(e.target.value)} disabled={encerrado} />
              </div>
              <Button className="w-full" disabled={!toDept || encaminhar.isPending || encerrado}
                onClick={() => encaminhar.mutate()}>
                <Send className="h-4 w-4" /> Encaminhar
              </Button>
              {encerrado && <p className="text-xs text-jari-500">Protocolo encerrado. Reabra-o para tramitar novamente.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Movimentar</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select aria-label="Tipo de movimentação" value={dispatchType} onChange={(e) => setDispatchType(e.target.value)}>
                {DESPACHOS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </Select>
              <Textarea aria-label="Observação" rows={2} placeholder="Observação (opcional)"
                value={dispatchNote} onChange={(e) => setDispatchNote(e.target.value)} />
              <Button variant="secondary" className="w-full" disabled={despachar.isPending}
                onClick={() => despachar.mutate()}>
                <FileText className="h-4 w-4" /> Registrar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Anexos</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {p.attachments?.length ? (
                <ul className="space-y-2 text-sm">
                  {p.attachments.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <Paperclip className="h-4 w-4 shrink-0 text-jari-500" aria-hidden />
                        <span className="truncate">{a.originalName}</span>
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => baixarAnexo(a.id, a.originalName)}>
                        <Download className="h-4 w-4" /> Baixar
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-jari-500">Nenhum anexo. Envie documentos em PDF, imagem ou DOC (até 15 MB).</p>
              )}
              <input
                ref={fileInput}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) enviarAnexo.mutate(f); e.target.value = ''; }}
              />
              <Button variant="outline" className="w-full" disabled={enviarAnexo.isPending}
                onClick={() => fileInput.current?.click()}>
                <Upload className="h-4 w-4" />
                {enviarAnexo.isPending ? 'Enviando…' : 'Enviar anexo'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
