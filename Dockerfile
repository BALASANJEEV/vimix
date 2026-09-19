# Build the Vite SPA.
FROM node:22-bookworm-slim AS frontend-builder
WORKDIR /app/frontend

COPY vimix-crm-frontend/package*.json ./
RUN npm ci
COPY vimix-crm-frontend/ ./

ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Install production backend dependencies.
FROM node:22-bookworm-slim AS backend-dependencies
WORKDIR /app/backend

COPY vimix-crm-backend/package*.json ./
RUN npm ci --omit=dev

# Run the SPA and API behind one HTTP port.
FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
    && apt-get install --no-install-recommends --yes nginx tini \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /app/backend/uploads /var/log/nginx /var/lib/nginx /run/nginx

COPY --from=backend-dependencies /app/backend/node_modules /app/backend/node_modules
COPY vimix-crm-backend/ /app/backend/
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && rm -f /etc/nginx/sites-enabled/default

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1/health/ready').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/usr/local/bin/docker-entrypoint.sh"]
