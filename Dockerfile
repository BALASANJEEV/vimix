# Dockerfile
# -------------------------------------------------------------
# 1️⃣  Frontend build stage
# -------------------------------------------------------------
FROM node:24-alpine AS frontend-builder
WORKDIR /app/frontend

# Install frontend dependencies
COPY vimix-crm-frontend/package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source code and build
COPY vimix-crm-frontend/ .
RUN npm run build

# -------------------------------------------------------------
# 2️⃣  Backend build stage
# -------------------------------------------------------------
FROM node:24-alpine AS backend-builder
WORKDIR /app/backend

# Install build utilities for native modules
RUN apk add --no-cache python3 make g++ gcc libc-dev sqlite-dev libpq-dev

# Install backend dependencies
COPY vimix-crm-backend/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy backend source
COPY vimix-crm-backend/ .

# -------------------------------------------------------------
# 3️⃣  Runtime image (Fargate)
# -------------------------------------------------------------
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
ENV MONGO_URI=mongodb://localhost:27017/vimix
WORKDIR /usr/src/app

# Install runtime dependencies
RUN apk add --no-cache nginx sqlite libpq \
    && mkdir -p /run/nginx /etc/nginx/conf.d \
    && rm -f /etc/nginx/conf.d/default.conf

# Copy backend runtime files
COPY --from=backend-builder /app/backend /usr/src/app

# Copy built frontend assets to Nginx document root
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Configure Nginx to serve the React app and proxy API calls
RUN cat > /etc/nginx/conf.d/default.conf <<'EOF'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

EXPOSE 80 5000
# Run Express in background and Nginx in foreground
CMD ["sh", "-c", "node server.js & nginx -g 'daemon off;'" ]