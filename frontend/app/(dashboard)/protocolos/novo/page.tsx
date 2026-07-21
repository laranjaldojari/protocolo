'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FileCheck2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import type { Department, Subject } from '@/lib/types';

const schema = z.object({
  subjectId: z.string().min(1, 'Selecione o assunto'),
  departmentId: z.string().min(1, 'Selecione o setor de destino'),
  priority: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']),
  description: z.string().min(10, 'Descreva a solicitação com pelo menos 10 caracteres'),
  applicantName: z.string().min(3, 'Informe o nome do requerente'),
  applicantDocument: z.string()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length === 11 || v.length === 14, 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos)'),
  applicantEmail: z.string().email('E-mail inválido').optional().or(z.literal('')),
  applicantPhone: z.string().optional(),
  applicantAddress: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function NovoProtocoloPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'NORMAL' },
  });

  const assuntos = useQuery({
    queryKey: ['assuntos'],
    queryFn: async () => (await api.get<Subject[]>('/protocolos/assuntos')).data,
  });
  const setores = useQuery({
    queryKey: ['setores'],
    queryFn: async () => (await api.get<Department[]>('/setores')).data,
  });

  const criar = useMutation({
    mutationFn: async (data: FormData) =>
      (await api.post('/protocolos', { ...data, applicantEmail: data.applicantEmail || undefined })).data,
    onSuccess: (p) => router.push(`/protocolos/${p.id}`),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="font-display text-2xl font-bold text-jari-900">Abrir protocolo</h1>

      <form onSubmit={handleSubmit((d) => criar.mutate(d))} className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Requerente</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="applicantName">Nome completo / Razão social</Label>
              <Input id="applicantName" {...register('applicantName')} />
              {errors.applicantName && <p className="text-xs text-red-700">{errors.applicantName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="applicantDocument">CPF ou CNPJ</Label>
              <Input id="applicantDocument" inputMode="numeric" placeholder="Somente números" {...register('applicantDocument')} />
              {errors.applicantDocument && <p className="text-xs text-red-700">{errors.applicantDocument.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="applicantPhone">Telefone</Label>
              <Input id="applicantPhone" placeholder="(96) 9xxxx-xxxx" {...register('applicantPhone')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="applicantEmail">E-mail</Label>
              <Input id="applicantEmail" type="email" {...register('applicantEmail')} />
              {errors.applicantEmail && <p className="text-xs text-red-700">{errors.applicantEmail.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="applicantAddress">Endereço</Label>
              <Input id="applicantAddress" {...register('applicantAddress')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Solicitação</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="subjectId">Assunto</Label>
              <Select id="subjectId" {...register('subjectId')}>
                <option value="">Selecione…</option>
                {assuntos.data?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
              {errors.subjectId && <p className="text-xs text-red-700">{errors.subjectId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="departmentId">Setor de destino</Label>
              <Select id="departmentId" {...register('departmentId')}>
                <option value="">Selecione…</option>
                {setores.data?.map((s) => <option key={s.id} value={s.id}>{s.acronym} — {s.name}</option>)}
              </Select>
              {errors.departmentId && <p className="text-xs text-red-700">{errors.departmentId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority">Prioridade</Label>
              <Select id="priority" {...register('priority')}>
                <option value="BAIXA">Baixa</option>
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-3">
              <Label htmlFor="description">Descrição da solicitação</Label>
              <Textarea id="description" rows={4} {...register('description')} />
              {errors.description && <p className="text-xs text-red-700">{errors.description.message}</p>}
            </div>
          </CardContent>
        </Card>

        {criar.isError && (
          <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            Não foi possível abrir o protocolo. Revise os campos e tente novamente.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" disabled={criar.isPending}>
            <FileCheck2 className="h-4 w-4" />
            {criar.isPending ? 'Protocolando…' : 'Protocolar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
