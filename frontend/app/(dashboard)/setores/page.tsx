'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

const schema = z.object({
  name: z.string().min(3, 'Informe o nome do setor'),
  acronym: z.string().min(2, 'Informe a sigla').max(10, 'A sigla tem no máximo 10 caracteres').toUpperCase(),
});
type FormData = z.infer<typeof schema>;

interface Setor { id: string; name: string; acronym: string; active: boolean; _count?: { protocols: number; users: number } }

export default function SetoresPage() {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const setores = useQuery({
    queryKey: ['setores'],
    queryFn: async () => (await api.get<Setor[]>('/setores')).data,
  });

  const criar = useMutation({
    mutationFn: async (data: FormData) => (await api.post('/setores', data)).data,
    onSuccess: () => { reset(); qc.invalidateQueries({ queryKey: ['setores'] }); },
  });

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold text-jari-900">Setores</h1>

      <Card>
        <CardHeader><CardTitle>Cadastrar setor</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => criar.mutate(d))} className="grid gap-3 sm:grid-cols-[1fr,180px,auto]">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" placeholder="Secretaria Municipal de…" {...register('name')} />
              {errors.name && <p className="text-xs text-red-700">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acronym">Sigla</Label>
              <Input id="acronym" placeholder="SEMXX" {...register('acronym')} />
              {errors.acronym && <p className="text-xs text-red-700">{errors.acronym.message}</p>}
            </div>
            <Button type="submit" className="self-end" disabled={criar.isPending}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <ul className="divide-y divide-jari-100">
            {setores.data?.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-jari-500" aria-hidden />
                  <span className="font-mono font-semibold">{s.acronym}</span> {s.name}
                </span>
                <span className="text-xs text-jari-500">
                  {s._count?.protocols ?? 0} protocolos · {s._count?.users ?? 0} servidores
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
