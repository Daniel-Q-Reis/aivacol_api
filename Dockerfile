FROM node:18-alpine AS base
WORKDIR /usr/src/app

FROM base AS dev
ENV NODE_ENV=development
COPY . .
RUN if [ -f package.json ]; then npm install; fi
EXPOSE 3000
CMD ["node", "scripts/dev-container-start.js"]

FROM base AS builder
ENV NODE_ENV=production
COPY . .
RUN mkdir -p node_modules \
  && if [ -f package-lock.json ]; then npm ci; elif [ -f package.json ]; then npm install; fi \
  && if [ -f package.json ] && npm run | grep -q " build"; then npm run build; else mkdir -p dist && cp scripts/placeholder-app.js dist/main.js; fi

FROM base AS production
ENV NODE_ENV=production
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/scripts ./scripts
COPY --from=builder /usr/src/app/node_modules ./node_modules
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD ["node", "scripts/container-healthcheck.js"]
CMD ["node", "dist/main.js"]
