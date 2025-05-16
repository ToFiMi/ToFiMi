# ---------- build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- runtime stage ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# 1) server + node_modules
COPY --from=builder /app/.next/standalone ./
# 2) statické súbory
COPY --from=builder /app/.next/static ./.next/static
# 3) public
COPY --from=builder /app/public ./public

# (voliteľne) menší heap pri builde postačí
ENV NODE_OPTIONS="--max-old-space-size=1024"

CMD ["node", "server.js"]
