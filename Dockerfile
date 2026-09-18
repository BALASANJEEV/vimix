# syntax=docker/dockerfile:1.4

# ---------- Frontend Builder ----------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/vimix-crm-frontend

# Install frontend dependencies
COPY vimix-crm-frontend/package*.json ./ 
RUN npm install --omit=dev --legacy-peer-deps

# Copy source and build
COPY vimix-crm-frontend/ .
RUN npm run build

# ---------- Backend Builder ----------
FROM node:20-alpine AS backend-builder
WORKDIR /app/vimix-crm-backend

# Install backend dependencies
COPY vimix-crm-backend/package*.json ./ 
RUN npm install --omit=dev --legacy-peer-deps

# Copy source
COPY vimix-crm-backend/ .

# ---------- Runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /usr/src/app

# Copy backend files and node_modules
COPY --from=backend-builder /app/vimix-crm-backend /usr/src/backend
COPY --from=backend-builder /app/vimix-crm-backend/node_modules /usr/src/backend/node_modules

# Copy frontend dist for nginx
COPY --from=frontend-builder /app/vimix-crm-frontend/dist /usr/share/nginx/html

# Install nginx
RUN apk add --no-cache nginx && \
    mkdir -p /run/nginx

# Write minimal nginx config (add required events block)
RUN echo 'worker_processes 1;' > /etc/nginx/nginx.conf && \
    echo 'events { }' >> /etc/nginx/nginx.conf && \
    cat <<EOF > /etc/nginx/http.d/default.conf
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html index.htm;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Expose ports
EXPOSE 80

# Default command to start backend in background and nginx in foreground
CMD ["sh", "-c", "mkdir -p /run/nginx && ( node /usr/src/backend/server.js & ) && nginx -g 'daemon off;'" ]