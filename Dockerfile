FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install frontend dependencies
COPY vimix-crm-frontend/package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY vimix-crm-frontend/ .
RUN npm run build


FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

# Install backend dependencies (production only)
COPY vimix-crm-backend/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy backend source
COPY vimix-crm-backend/ .
# In case the backend has a build step (e.g., TypeScript), uncomment:
# RUN npm run build


FROM node:20-alpine AS runtime
ENV NODE_ENV=production
# Install nginx
RUN apk add --no-cache nginx

# Create required directories
RUN mkdir -p /run/nginx \
    && mkdir -p /etc/nginx/http.d \
    && mkdir -p /usr/share/nginx/html

# Set working directory for the backend
WORKDIR /usr/src/app

# Copy backend runtime files
COPY --from=backend-builder /app/backend ./

# Copy built frontend assets into nginx html folder
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Nginx configuration – serve SPA and proxy API calls to backend
RUN rm -f /etc/nginx/http.d/default.conf && \
    cat > /etc/nginx/http.d/default.conf <<'EOF'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to the Node backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

EXPOSE 80

# Start backend in background and keep nginx in foreground
CMD ["sh", "-c", "mkdir -p /run/nginx && (node server.js &) && nginx -g 'daemon off;'"]