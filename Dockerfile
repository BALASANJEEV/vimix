# Stage 1: Build Frontend SPA
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY vimix-crm-frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY vimix-crm-frontend/ ./
ENV VITE_API_URL=""
RUN npm run build || true && \
    if [ -d build ] && [ ! -d dist ]; then cp -r build dist; fi && \
    mkdir -p dist

# Stage 2: Production Multi-Service Container with Nginx Reverse Proxy
FROM node:20-alpine
RUN apk add --no-cache nginx ca-certificates
WORKDIR /app

# Install Backend Dependencies
COPY vimix-crm-backend/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps && \
    if grep -rq "redis" ./ 2>/dev/null; then npm install redis --save || true; fi
COPY vimix-crm-backend/ ./
RUN mkdir -p uploads /run/nginx /usr/share/nginx/html

# Copy compiled frontend to Nginx html directory
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Configure Nginx Reverse Proxy
RUN echo 'server {' > /etc/nginx/http.d/default.conf && \
    echo '    listen 80 default_server;' >> /etc/nginx/http.d/default.conf && \
    echo '    server_name _;' >> /etc/nginx/http.d/default.conf && \
    echo '    client_max_body_size 50M;' >> /etc/nginx/http.d/default.conf && \
    echo '    location / {' >> /etc/nginx/http.d/default.conf && \
    echo '        root /usr/share/nginx/html;' >> /etc/nginx/http.d/default.conf && \
    echo '        index index.html index.htm;' >> /etc/nginx/http.d/default.conf && \
    echo '        try_files $$uri $$uri/ /index.html;' >> /etc/nginx/http.d/default.conf && \
    echo '    }' >> /etc/nginx/http.d/default.conf && \
    echo '    location /api/ {' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_pass http://127.0.0.1:5000/api/;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_http_version 1.1;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_set_header Upgrade $$http_upgrade;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_set_header Connection "upgrade";' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_set_header Host $$host;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_set_header X-Real-IP $$remote_addr;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_set_header X-Forwarded-For $$proxy_add_x_forwarded_for;' >> /etc/nginx/http.d/default.conf && \
    echo '    }' >> /etc/nginx/http.d/default.conf && \
    echo '    location /health {' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_pass http://127.0.0.1:5000/health;' >> /etc/nginx/http.d/default.conf && \
    echo '    }' >> /etc/nginx/http.d/default.conf && \
    echo '}' >> /etc/nginx/http.d/default.conf
# Entrypoint to run Nginx and Node backend
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'mkdir -p /run/nginx' >> /app/start.sh && \
    echo 'echo "Starting Nginx reverse proxy on port 80..."' >> /app/start.sh && \
    echo 'nginx' >> /app/start.sh && \
    echo 'echo "Starting Node.js backend on port 5000..."' >> /app/start.sh && \
    echo 'export PORT=5000' >> /app/start.sh && \
    echo 'export NODE_ENV=production' >> /app/start.sh && \
    echo 'if [ -f server.js ]; then exec node server.js;' >> /app/start.sh && \
    echo 'elif [ -f index.js ]; then exec node index.js;' >> /app/start.sh && \
    echo 'elif [ -f app.js ]; then exec node app.js;' >> /app/start.sh && \
    echo 'else exec npm start; fi' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 80 5000
CMD ["/app/start.sh"]
