FROM node:20-alpine AS frontend-builder
WORKDIR /app/vimix-crm-frontend
COPY vimix-crm-frontend/package*.json ./
RUN npm ci
COPY vimix-crm-frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-builder
WORKDIR /app/vimix-crm-backend
COPY vimix-crm-backend/package*.json ./
RUN npm ci
COPY vimix-crm-backend/ ./

FROM node:20-alpine
RUN apk add --no-cache nginx wget && \
    mkdir -p /run/nginx /etc/nginx/http.d /usr/src/app/uploads /var/www/html

# Copy backend from builder (includes source + node_modules)
COPY --from=backend-builder /app/vimix-crm-backend/ /usr/src/app

# Frontend static build
COPY --from=frontend-builder /app/vimix-crm-frontend/dist /var/www/html

# Nginx configuration
RUN cat > /etc/nginx/http.d/default.conf <<'EOF'
server {
    listen 80;
    server_name _;
    root /var/www/html;
    index index.html;
    client_max_body_size 20m;
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /uploads/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
    }
    location /health {
        proxy_pass http://127.0.0.1:5000;
    }
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

WORKDIR /usr/src/app
ENV NODE_ENV=production \
    PORT=5000
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/health || exit 1

# Start script: run node in background with restart loop, nginx in foreground (PID 1)
CMD ["sh", "-c", "mkdir -p /run/nginx /usr/src/app/uploads; (while true; do node server.js; sleep 2; done &) ; exec nginx -g 'daemon off;'"]
