# Tutorial de Deploy — Sistema de Protocolo (GitHub + Dokploy)

Este guia leva o sistema do zero até o ar em um servidor próprio (VPS), usando o **GitHub** como repositório do código e o **Dokploy** como painel de deploy (alternativa self-hosted ao Heroku/Vercel, baseada em Docker e Traefik).

Ao final você terá:

| Serviço | Endereço (exemplo) |
|---|---|
| Frontend (Next.js) | `https://protocolo.laranjaldojari.cloud` |
| API (NestJS) + Swagger | `https://api-protocolo.laranjaldojari.cloud` |
| PostgreSQL 16 | interno (rede Docker) |
| Redis 7 | interno (rede Docker) |

> Nos exemplos uso os domínios acima. Substitua pelos seus. Se ainda não tiver domínio, o Dokploy gera um subdomínio `*.traefik.me` para testes.

---

## 1. Pré-requisitos

- **VPS** com Ubuntu 22.04/24.04, mínimo **2 vCPU e 4 GB de RAM** (Hetzner, Contabo, DigitalOcean, Oracle, etc.), com IP público e portas **80, 443 e 3000** liberadas (a 3000 é só para o painel do Dokploy).
- **Conta no GitHub**.
- **Domínio** com acesso ao painel de DNS (opcional para testes, obrigatório para produção).
- **Git** e **Node 20+** na sua máquina local.

---

## 2. Subir o código para o GitHub

O projeto já vem com `Dockerfile` no backend e no frontend, `.dockerignore` e `.gitignore` — não versione `.env` nem `node_modules`.

### 2.1 Criar o repositório

1. Acesse https://github.com/new
2. Nome: `protocolo-ldj` · Visibilidade: **Private**
3. Não marque "Add a README" (o projeto já tem um).

### 2.2 Enviar o código

Na pasta raiz do projeto (`protocolo-ldj/`):

```bash
git init
git add .
git commit -m "feat: sistema de protocolo - versao inicial"
git branch -M main
git remote add origin git@github.com:SEU_USUARIO/protocolo-ldj.git
git push -u origin main
```

> Se preferir HTTPS: `git remote add origin https://github.com/SEU_USUARIO/protocolo-ldj.git`

### 2.3 Gerar a migration inicial do Prisma (uma única vez)

O deploy em produção roda `prisma migrate deploy`, que aplica migrations já commitadas. Gere-a localmente com o banco do `docker-compose`:

```bash
cd backend
npm install
docker compose -f ../docker-compose.yml up -d postgres
cp .env.example .env   # confira a DATABASE_URL local
npx prisma migrate dev --name init
git add prisma/migrations
git commit -m "chore: migration inicial"
git push
```

---

## 3. Instalar o Dokploy no VPS

Conecte via SSH e rode o instalador oficial:

```bash
ssh root@IP_DO_SERVIDOR
curl -sSL https://dokploy.com/install.sh | sh
```

Ao terminar, acesse `http://IP_DO_SERVIDOR:3000`, crie o **usuário administrador** e faça login.

> Recomendado: em **Settings → Server**, defina um domínio para o próprio painel (ex.: `deploy.laranjaldojari.cloud`) e ative HTTPS. Depois disso você pode fechar a porta 3000 no firewall.

---

## 4. Conectar o Dokploy ao GitHub

1. No painel: **Settings → Git → GitHub → Create GitHub App**.
2. O GitHub abrirá a tela de instalação do app: autorize e selecione o repositório `protocolo-ldj`.
3. De volta ao Dokploy, o GitHub aparecerá como provedor conectado.

Isso habilita o deploy direto do repositório **e** o deploy automático a cada `git push` (webhook criado automaticamente).

---

## 5. Criar o projeto e os bancos

1. **Projects → Create Project** → nome: `Protocolo LDJ`.

### 5.1 PostgreSQL

1. Dentro do projeto: **Create Service → Database → PostgreSQL**.
2. Preencha:
   - Name: `protocolo-db`
   - Database Name: `protocolo_ldj`
   - Username: `protocolo`
   - Password: gere uma senha forte (guarde-a)
   - Docker image: `postgres:16-alpine`
3. Clique em **Deploy** e aguarde ficar verde (Running).
4. Anote o **host interno** exibido na aba *General/Connections* — normalmente é o próprio nome do serviço (ex.: `protocolo-db`), acessível pelos outros serviços do mesmo projeto na porta `5432`. **Não** exponha a porta externa.

### 5.2 Redis

1. **Create Service → Database → Redis**.
2. Name: `protocolo-redis` · imagem `redis:7-alpine` · defina senha se desejar.
3. **Deploy**. Host interno: `protocolo-redis`, porta `6379`.

---

## 6. Deploy do backend (API)

1. **Create Service → Application** → nome: `protocolo-api`.
2. Aba **General**:
   - Source: **GitHub** → repositório `protocolo-ldj` → branch `main`
   - Build Type: **Dockerfile**
   - **Docker Context Path**: `backend`
   - **Docker File**: `backend/Dockerfile`
3. Aba **Environment** — cole as variáveis (ajuste senha e domínios):

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://protocolo:SENHA_DO_BANCO@protocolo-db:5432/protocolo_ldj?schema=public
REDIS_HOST=protocolo-redis
REDIS_PORT=6379
JWT_ACCESS_SECRET=GERE_UM_SEGREDO_LONGO_ALEATORIO
JWT_REFRESH_SECRET=GERE_OUTRO_SEGREDO_DIFERENTE
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
FRONTEND_URL=https://protocolo.laranjaldojari.cloud
UPLOAD_DIR=/app/uploads
```

   > Gere os segredos com: `openssl rand -base64 48`

4. Aba **Advanced → Volumes / Mounts** — crie um **Volume Mount** para os anexos e comprovantes não se perderem a cada deploy:
   - Volume Name: `protocolo-uploads`
   - Mount Path: `/app/uploads`
5. Aba **Domains** → **Add Domain**:
   - Host: `api-protocolo.laranjaldojari.cloud`
   - **Container Port: `3001`**
   - HTTPS: ativado · Certificate: **Let's Encrypt**
6. No seu provedor de DNS, crie um registro **A** apontando `api-protocolo` → IP do VPS.
7. Clique em **Deploy** e acompanhe a aba **Deployments/Logs**. O container roda `prisma migrate deploy` antes de subir a API — as tabelas são criadas sozinhas.

### 6.1 Rodar o seed (usuários e setores iniciais)

Uma única vez, após o primeiro deploy: abra a aba **Terminal** do serviço `protocolo-api` (shell dentro do container) e rode:

```bash
node -e "require('child_process').execSync('npx prisma db seed',{stdio:'inherit'})" || npx ts-node prisma/seed.ts
```

> Se o container não tiver `ts-node` (imagem de produção), rode o seed a partir da sua máquina apontando para o banco de produção: exponha temporariamente a porta do Postgres no Dokploy (External Port), rode localmente `DATABASE_URL="postgresql://protocolo:SENHA@IP_DO_SERVIDOR:5432/protocolo_ldj" npx prisma db seed` e **remova a porta externa em seguida**.

Teste: `https://api-protocolo.seudominio/docs` deve abrir o Swagger.

---

## 7. Deploy do frontend

1. **Create Service → Application** → nome: `protocolo-web`.
2. Aba **General**:
   - Source: GitHub → `protocolo-ldj` → `main`
   - Build Type: **Dockerfile**
   - **Docker Context Path**: `frontend`
   - **Docker File**: `frontend/Dockerfile`
3. **Importante:** as variáveis `NEXT_PUBLIC_*` entram no bundle **durante o build**. Configure-as como **Build Args** (aba Advanced → Build Args, ou no campo de build da aba General, conforme a versão do Dokploy):

```env
NEXT_PUBLIC_API_URL=https://api-protocolo.laranjaldojari.cloud/api/v1
NEXT_PUBLIC_WS_URL=https://api-protocolo.laranjaldojari.cloud
```

   Repita as duas também na aba **Environment** (não faz mal e cobre versões do painel que injetam env no build).
4. Aba **Domains** → Host: `protocolo.laranjaldojari.cloud` · **Container Port: `3000`** · HTTPS + Let's Encrypt.
5. Crie o registro **A** no DNS: `protocolo` → IP do VPS.
6. **Deploy**.

Acesse o domínio: a consulta pública deve carregar. Entre em `/login` com `admin@laranjaldojari.cloud` / `Admin@123` e **troque a senha imediatamente**.

---

## 8. Deploy automático a cada push

Em cada aplicação (`protocolo-api` e `protocolo-web`), aba **General**, ative **Auto Deploy**. A partir daí:

```bash
git add .
git commit -m "ajuste na tela de protocolos"
git push
```

…dispara o webhook do GitHub e o Dokploy reconstrói e publica sozinho. As migrations novas (commitadas em `backend/prisma/migrations/`) são aplicadas automaticamente na subida do container.

---

## 9. Backups e manutenção

- **Banco:** no serviço `protocolo-db`, aba **Backups**, configure backup agendado (o Dokploy suporta destino S3-compatível — AWS S3, Backblaze B2, MinIO). Sugestão: diário, retenção de 30 dias.
- **Anexos:** o volume `protocolo-uploads` vive em `/var/lib/docker/volumes/` no VPS. Inclua-o na rotina de backup do servidor (ex.: `restic`/`rclone` para um bucket).
- **Atualizar o Dokploy:** Settings → Web Server → Update.
- **Logs:** aba **Logs** de cada serviço (o backend loga em JSON estruturado via Pino).
- **Monitoramento:** aba **Monitoring** mostra CPU/RAM/rede por container.

---

## 10. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Build do backend falha em `prisma generate` | Rede/DNS do VPS bloqueando `binaries.prisma.sh` | Verifique firewall/DNS do servidor |
| API sobe mas erro `P1001` (can't reach database) | `DATABASE_URL` com host errado | Use o **nome do serviço** (`protocolo-db`), não `localhost`; serviços precisam estar no mesmo projeto |
| Frontend abre mas chamadas caem em `localhost:3001` | `NEXT_PUBLIC_API_URL` não foi passada como **Build Arg** | Configure o build arg e faça **Rebuild** (não basta restart) |
| Erro de CORS no navegador | `FRONTEND_URL` do backend diferente do domínio real | Corrija a env e redeploy da API |
| Notificações em tempo real não conectam | `NEXT_PUBLIC_WS_URL` errada ou proxy sem WebSocket | Use a URL base da API (sem `/api/v1`); o Traefik do Dokploy já suporta WebSocket |
| Upload some após deploy | Volume não montado | Confira o mount `/app/uploads` (passo 6.4) |
| Certificado HTTPS não emite | DNS ainda propagando ou porta 80 fechada | Aguarde a propagação e libere a porta 80 |

---

## 11. Checklist final de produção

- [ ] Segredos JWT únicos e longos (nunca os do `.env.example`)
- [ ] Senha do banco forte e porta 5432 **sem** exposição externa
- [ ] Senhas dos usuários seed trocadas no primeiro acesso
- [ ] HTTPS ativo nos dois domínios
- [ ] Backup agendado do PostgreSQL + volume de uploads
- [ ] Painel do Dokploy protegido (domínio próprio + porta 3000 fechada no firewall)
- [ ] Auto Deploy ativado nas duas aplicações
