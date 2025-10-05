# =========================
# ======= BUILD STAGE =====
# =========================
FROM node:lts-alpine AS builder
WORKDIR /app

# System deps sometimes needed by Next.js/sharp on Alpine
# (safe to keep; no-ops if unused)
RUN apk add --no-cache libc6-compat

# Keep build logs clean and disable telemetry during CI/builds
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only package manifests first for better caching
COPY package*.json ./

# Install dependencies (include dev deps for building)
RUN npm ci

# Copy the rest of the source
COPY . .

# Optional: limit Node heap during build if you’re on small runners
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Create the standalone production build
# Make sure next.config.js has output: 'standalone' (Next 13+ handles this automatically in many cases)
RUN npm run build


# ==========================
# ===== RUNTIME STAGE ======
# ==========================
FROM node:lts-alpine AS runner
WORKDIR /app

# Environment for runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
# Ensure the server binds to all interfaces inside the container
ENV HOSTNAME=0.0.0.0

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs \
  && adduser -S nextjs -u 1001

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# 1) copy the standalone server (includes minimal node_modules + server.js)
COPY --from=builder /app/.next/standalone ./
# 2) copy static assets
COPY --from=builder /app/.next/static ./.next/static
# 3) copy public assets
COPY --from=builder /app/public ./public
# 4) scripts + entrypoint
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

# (Optional) Healthcheck – uncomment if you want Docker to monitor the app
# HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
#   CMD wget -qO- http://localhost:${PORT} || exit 1

RUN chmod +x /app/entrypoint.sh

EXPOSE 3000
USER nextjs

ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
