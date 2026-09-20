# ============================================================
# Stage 1: Build Frontend SPA
# ============================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
# Install frontend dependencies
COPY vimix-crm-frontend/package*.json ./

RUN npm install --legacy-peer-deps

# Copy frontend source
COPY vimix-crm-frontend/ ./

# Vite API URL
ENV VITE_API_URL=""

# Build frontend
RUN npm run build

# ============================================================
# Stage 2: Production Container
# Nginx + Node.js Backend
# ============================================================
FROM node:20-alpine

# Install Nginx and CA certificates
RUN apk add --no-cache nginx ca-certificates

WORKDIR /app

# ============================================================
# Install Backend Dependencies
# ============================================================

COPY vimix-crm-backend/package*.json ./

RUN npm install --omit=dev --legacy-peer-deps

# Copy backend source
COPY vimix-crm-backend/ ./

# Create required directories
RUN mkdir -p \
    uploads \
    /run/nginx \
    /usr/share/nginx/html

# ============================================================
# Copy compiled frontend to Nginx
# ============================================================

COPY --from=frontend-builder \
    /app/frontend/dist \
    /usr/share/nginx/html

# ============================================================
# Configure Nginx
# ============================================================

RUN echo 'server {' > /etc/nginx/http.d/default.conf && \
    echo '    listen 80 default_server;' >> /etc/nginx/http.d/default.conf && \
    echo '    server_name _;' >> /etc/nginx/http.d/default.conf && \
    echo '    client_max_body_size 50M;' >> /etc/nginx/http.d/default.conf && \
    echo '' >> /etc/nginx/http.d/default.conf && \
    echo '    location / {' >> /etc/nginx/http.d/default.conf && \
    echo '        root /usr/share/nginx/html;' >> /etc/nginx/http.d/default.conf && \
    echo '        index index.html index.htm;' >> /etc/nginx/http.d/default.conf && \
    echo '        try_files $uri $uri/ /index.html;' >> /etc/nginx/http.d/default.conf && \
    echo '    }' >> /etc/nginx/http.d/default.conf && \
    echo '' >> /etc/nginx/http.d/default.conf && \
    echo '    location /api/ {' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_pass http://127.0.0.1:5000/api/;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_http_version 1.1;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_set_header Upgrade $http_upgrade;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_set_header Connection "upgrade";' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_set_header Host $host;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_set_header X-Real-IP $remote_addr;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' >> /etc/nginx/http.d/default.conf && \
    echo '    }' >> /etc/nginx/http.d/default.conf && \
    echo '' >> /etc/nginx/http.d/default.conf && \
    echo '    location /health {' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_pass http://127.0.0.1:5000/health;' >> /etc/nginx/http.d/default.conf && \
    echo '    }' >> /etc/nginx/http.d/default.conf && \
    echo '}' >> /etc/nginx/http.d/default.conf

# IMPORTANT:
# Validate Nginx configuration during Docker build.
# If the config is invalid, the Docker build fails.
RUN nginx -t

# ============================================================
# Startup Script
# ============================================================

RUN printf '%s\n' \
    '#!/bin/sh' \
    'set -e' \
    '' \
    'mkdir -p /run/nginx' \
    '' \
    'echo "Testing Nginx configuration..."' \
    'nginx -t' \
    '' \
    'echo "Starting Nginx reverse proxy on port 80..."' \
    'nginx' \
    '' \
    'echo "Starting Node.js backend on port 5000..."' \
    'export PORT=5000' \
    'export NODE_ENV=production' \
    '' \
    'if [ -f server.js ]; then' \
    '    exec node server.js' \
    'elif [ -f index.js ]; then' \
    '    exec node index.js' \
    'elif [ -f app.js ]; then' \
    '    exec node app.js' \
    'else' \
    '    exec npm start' \
    'fi' \
    > /app/start.sh && chmod +x /app/start.sh

# ============================================================
# Ports
# ============================================================

EXPOSE 80 5000

# ============================================================
# Start Application
# ============================================================

CMD ["/app/start.sh"]
