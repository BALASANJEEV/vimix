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

# Create uploads directory and set permissions
RUN mkdir -p /usr/src/app/uploads && chmod 755 /usr/src/app/uploads

# Create startup script with fixed nginx daemon directive
RUN echo '#!/bin/sh\n\n# Start nginx in the background\nnginx -g "daemon off;" &\nNGINX_PID=$!\n\n# Wait for nginx to be ready (max 10 seconds)\nfor i in $(seq 1 10); do\n    if wget -qO- http://127.0.0.1:80/health >/dev/null 2>&1; then\n        break\n    fi\n    sleep 1\ndone\n\n# Start the Node.js application and capture any startup errors\nnode server.js 2>&1\nRC=$?\nkill $NGINX_PID 2>/dev/null\nexit $RC' > /start.sh && chmod +x /start.sh

# Health check – wait for the Node.js server to be ready
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD wget -qO- http://127.0.0.1:5000/health || exit 1

CMD ["/start.sh"]
