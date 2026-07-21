'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import type { Department } from '@/lib/types';

const schema = z.object({
  name: z.string().min(3, 'Informe o nome'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'A senha precisa de pelo menos 8 caracteres'),
  role: z.enum(['ADMIN', 'GESTOR', 'ATENDENTE', 'SERVIDOR']),
  departmentId: z.string().min(1, 'Selecione o setor'),
});
type FormData = z.infer<typeof schema>;

const ROLE_LABEL = { ADMIN: 'Administrador', GESTOR: 'Gestor', ATENDENTE: 'Atendente', SERVIDOR: 'Servidor' } as const;

interface Usuario {
  id: string; name: string; email: string; role: keyof typeof ROLE_LABEL; active: boolean;
  department?: { acronym: string } | null;
}

export default function UsuariosPage() {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { role: 'SERVIDOR' },
  });

  const usuarios = useQuery({ queryKey: ['usuarios'], queryFn: async () => (await api.get<Usuario[]>('/usuarios')).data });
  const setores = useQuery({ queryKey: ['setores'], queryFn: async () => (await api.get<Department[]>('/setores')).data });

  const criar = useMutation({
    mutationFn: async (data: FormData) => (await api.post('/usuarios', data)).data,
    onSuccess: () => { reset(); qc.invalidateQueries({ queryKey: ['usuarios'] }); },
  });

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold text-jari-900">Usuários</h1>

      <Card>
        <CardHeader><CardTitle>Cadastrar servidor</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => criar.mutate(d))} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-red-700">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-red-700">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha inicial</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-xs text-red-700">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Perfil</Label>
              <Select id="role" {...register('role')}>
                {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="departmentId">Setor</Label>
              <Select id="departmentId" {...register('departmentId')}>
                <option value="">Selecione…</option>
                {setores.data?.map((s) => <option key={s.id} value={s.id}>{s.acronym} — {s.name}</option>)}
              </Select>
              {errors.departmentId && <p className="text-xs text-red-700">{errors.departmentId.message}</p>}
            </div>
            <Button type="submit" className="self-end" disabled={criar.isPending}>
              <UserPlus className="h-4 w-4" /> Cadastrar
            </Button>
          </form>
          {criar.isError && (
            <p role="alert" className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
              Não foi possível cadastrar. Verifique se o e-mail já está em uso.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-jari-200 text-left text-xs uppercase tracking-wide text-jari-500">
                <th className="py-2 pr-3">Nome</th>
                <th className="py-2 pr-3">E-mail</th>
                <th className="py-2 pr-3">Setor</th>
                <th className="py-2 pr-3">Perfil</th>
                <th className="py-2">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-jari-100">
              {usuarios.data?.map((u) => (
                <tr key={u.id}>
                  <td className="py-2.5 pr-3 font-medium">{u.name}</td>
                  <td className="py-2.5 pr-3 text-jari-600">{u.email}</td>
                  <td className="py-2.5 pr-3">{u.department?.acronym ?? '—'}</td>
                  <td className="py-2.5 pr-3">{ROLE_LABEL[u.role]}</td>
                  <td className="py-2.5">
                    <Badge className={u.active ? 'border-green-300 bg-green-100 text-green-800' : 'border-gray-300 bg-gray-100 text-gray-600'}>
                      {u.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
