'use client';
import { Bell, FileStack, FilePlus2, LayoutDashboard, Landmark, LogOut, Users, Building2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { api, session } from '@/lib/api';
import type { SessionUser } from '@/lib/types';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { href: '/protocolos', label: 'Protocolos', icon: FileStack },
  { href: '/protocolos/novo', label: 'Novo protocolo', icon: FilePlus2 },
  { href: '/setores', label: 'Setores', icon: Building2, admin: true },
  { href: '/usuarios', label: 'Usuários', icon: Users, admin: true },
];

interface Toast { title: string; message: string; at: string }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const u = session.user;
    if (!u || !session.access) { router.replace('/login'); return; }
    setUser(u);

    const socket: Socket = io(`${process.env.NEXT_PUBLIC_WS_URL}/notifications`, {
      auth: { token: session.access },
      transports: ['websocket'],
    });
    socket.on('notification', (n: Toast) => {
      setToasts((prev) => [n, ...prev].slice(0, 5));
    });
    return () => { socket.disconnect(); };
  }, [router]);

  async function logout() {
    try { await api.post('/auth/logout', { refreshToken: session.refresh }); } catch { /* segue */ }
    session.clear();
    router.replace('/login');
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r border-jari-800 bg-jari-900 text-white">
        <div className="flex items-center gap-2 border-b-2 border-rio-500 px-4 py-4">
          <Landmark className="h-6 w-6 text-rio-500" aria-hidden />
          <div className="leading-tight">
            <p className="font-display text-sm font-bold">Protocolo Digital</p>
            <p className="text-[11px] text-jari-300">Laranjal do Jari · AP</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.filter((n) => !n.admin || user.role === 'ADMIN').map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-jari-200 hover:bg-jari-800 hover:text-white',
                pathname === n.href && 'bg-jari-800 text-white',
              )}
            >
              <n.icon className="h-4 w-4" aria-hidden /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-jari-800 p-3">
          <p className="truncate px-2 text-xs text-jari-300">{user.name}</p>
          <Button variant="ghost" size="sm" onClick={logout}
            className="mt-1 w-full justify-start text-jari-200 hover:bg-jari-800 hover:text-white">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex-1">
        <main className="mx-auto max-w-6xl p-6">{children}</main>
      </div>

      {/* Notificações em tempo real */}
      <div aria-live="polite" className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((t, i) => (
          <div key={t.at + i} className="rounded-lg border border-jari-300 bg-white p-3 shadow-lg">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-jari-900">
              <Bell className="h-4 w-4 text-rio-600" aria-hidden /> {t.title}
            </p>
            <p className="mt-0.5 text-sm text-jari-700">{t.message}</p>
            <button
              className="mt-1 text-xs font-medium text-jari-600 underline"
              onClick={() => setToasts((prev) => prev.filter((_, j) => j !== i))}
            >
              Dispensar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
