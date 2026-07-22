# ---------- Build ----------
FROM node:20-slim AS build
WORKDIR /app

# Variáveis NEXT_PUBLIC_* são embutidas no bundle NO MOMENTO DO BUILD.
# Defina-as como Build Args no Dokploy (não apenas como env de runtime).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# ---------- Runtime ----------
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Saída standalone do Next: servidor mínimo + estáticos
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
