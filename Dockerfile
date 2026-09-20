# ============================================================
# Stage 1: Build Frontend SPA (Vite + React + TypeScript)
# ============================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY vimix-crm-frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY vimix-crm-frontend/ ./

# API URL is empty so the SPA uses relative paths behind Nginx
ENV VITE_API_URL=""
RUN npm run build

# ============================================================
# Stage 2: Install Backend Dependencies
# ============================================================
FROM node:20-alpine AS backend-builder

WORKDIR /app
COPY vimix-crm-backend/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

COPY vimix-crm-backend/ ./

# ============================================================
# Stage 3: Production Runtime — Nginx (SPA + reverse proxy) + Node.js API
# ============================================================
FROM node:20-alpine

RUN apk add --no-cache nginx ca-certificates curl

WORKDIR /app

# Copy full backend application (all routes, models, middleware, config)
COPY --from=backend-builder /app /app

# Create required directories
RUN mkdir -p \
    /app/uploads \
    /run/nginx \
    /etc/nginx/http.d \
    /usr/share/nginx/html

# Copy compiled frontend assets
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Configure Nginx: serve SPA on port 80, proxy /api and /health to backend
RUN printf '%s\n' \
    'server {' \
    '    listen 80 default_server;' \
    '    server_name _;' \
    '    client_max_body_size 50M;' \
    '' \
    '    location / {' \
    '        root /usr/share/nginx/html;' \
    '        index index.html index.htm;' \
    '        try_files $uri $uri/ /index.html;' \
    '    }' \
    '' \
    '    location /api/ {' \
    '        proxy_pass http://127.0.0.1:5000/api/;' \
    '        proxy_http_version 1.1;' \
    '        proxy_set_header Upgrade $http_upgrade;' \
    '        proxy_set_header Connection "upgrade";' \
    '        proxy_set_header Host $host;' \
    '        proxy_set_header X-Real-IP $remote_addr;' \
    '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' \
    '        proxy_read_timeout 300s;' \
    '    }' \
    '' \
    '    location /uploads/ {' \
    '        proxy_pass http://127.0.0.1:5000/uploads/;' \
    '    }' \
    '' \
    '    location /health {' \
    '        proxy_pass http://127.0.0.1:5000/health;' \
    '    }' \
    '}' \
    > /etc/nginx/http.d/default.conf

# Validate Nginx configuration at build time
RUN nginx -t

# Startup script: launch backend in background, Nginx in foreground
RUN printf '%s\n' \
    '#!/bin/sh' \
    'set -e' \
    '' \
    'mkdir -p /run/nginx /app/uploads' \
    '' \
    'echo "Validating Nginx configuration..."' \
    'nginx -t' \
    '' \
    'echo "Starting Node.js backend on port 5000..."' \
    'export PORT=5000' \
    'export NODE_ENV=production' \
    'node /app/server.js &' \
    '' \
    'echo "Starting Nginx on port 80..."' \
    'exec nginx -g "daemon off;"' \
    > /app/start.sh && chmod +x /app/start.sh

ENV NODE_ENV=production
ENV PORT=5000
ENV UPLOAD_DIR=/app/uploads

EXPOSE 80 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["/app/start.sh"]