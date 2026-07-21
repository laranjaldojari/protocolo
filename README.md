# Sistema de Protocolo — Prefeitura Municipal de Laranjal do Jari/AP

Sistema online de protocolo eletrônico: abertura, tramitação, consulta pública e gestão de processos administrativos.

## Stack

| Camada | Tecnologias |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, React Hook Form, Zod, TanStack Query, Axios, Lucide |
| Backend | NestJS, TypeScript, Prisma ORM, PostgreSQL, Redis, BullMQ, JWT + Refresh Token, Passport, Swagger, WebSocket (Socket.IO), Upload (Multer), PDF (PDFKit), Logs estruturados (Pino) |
| Banco | PostgreSQL — todas as tabelas com CUID, createdAt, updatedAt, deletedAt (soft delete) e auditoria completa |

## Subindo o ambiente

```bash
# 1. Infra (PostgreSQL + Redis)
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev        # http://localhost:3001  |  Swagger: /docs

# 3. Frontend
cd ../frontend
cp .env.example .env.local
npm install
npm run dev              # http://localhost:3000
```

## Credenciais iniciais (seed)

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | admin@laranjaldojari.ap.gov.br | Admin@123 |
| Atendente | atendente@laranjaldojari.ap.gov.br | Atende@123 |

## Funcionalidades

- Abertura de protocolo com numeração sequencial anual (ex.: `000042/2026`)
- Tramitação entre setores com histórico completo e despachos
- Upload de anexos (PDF, imagens, docs) por protocolo
- Comprovante de protocolo em PDF (gerado em fila BullMQ)
- Consulta pública por número do protocolo (sem login)
- Notificações em tempo real via WebSocket ao setor de destino
- Auditoria completa (quem, o quê, quando, dados antes/depois)
- Soft delete em todas as entidades
- RBAC: ADMIN, GESTOR, ATENDENTE, SERVIDOR
