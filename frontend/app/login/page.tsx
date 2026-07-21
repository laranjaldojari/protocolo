'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Landmark, LockKeyhole } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, session } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(6, 'A senha tem no mínimo 6 caracteres'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const login = useMutation({
    mutationFn: async (data: FormData) => (await api.post('/auth/login', data)).data,
    onSuccess: (data) => { session.save(data); router.push('/dashboard'); },
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-jari-900 px-4">
      <Card className="w-full max-w-md border-t-4 border-t-rio-500">
        <CardHeader className="items-center text-center">
          <Landmark className="h-10 w-10 text-jari-700" aria-hidden />
          <CardTitle className="text-xl">Protocolo Digital</CardTitle>
          <p className="text-sm text-jari-600">Prefeitura de Laranjal do Jari · AP</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => login.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail institucional</Label>
              <Input id="email" type="email" autoComplete="username" {...register('email')} />
              {errors.email && <p className="text-xs text-red-700">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
              {errors.password && <p className="text-xs text-red-700">{errors.password.message}</p>}
            </div>
            {login.isError && (
              <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
                E-mail ou senha incorretos.
              </p>
            )}
            <Button type="submit" className="w-full" disabled={login.isPending}>
              <LockKeyhole className="h-4 w-4" />
              {login.isPending ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
