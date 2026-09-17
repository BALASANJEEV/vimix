FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install all dependencies (including dev) needed to build the frontend
COPY vimix-crm-frontend/package*.json ./
# Use npm ci for a clean, reproducible install; keep legacy‑peer‑deps flag that the project relied on
RUN npm ci --legacy-peer-deps

# Copy source and build the React/Vite app
COPY vimix-crm-frontend/ .
RUN npm run build

FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

# Install build tools required for native modules like sqlite3
RUN apk add --no-cache python3 make g++ gcc libc-dev sqlite-dev

# Install backend production dependencies only (no dev deps needed at runtime)
COPY vimix-crm-backend/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy backend source code (no additional build step required)
COPY vimix-crm-backend/ .

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Install nginx to serve the built frontend and proxy API requests
RUN apk add --no-cache nginx && \
    mkdir -p /run/nginx && \
    mkdir -p /etc/nginx/conf.d && \
    rm -f /etc/nginx/conf.d/default.conf

# Copy backend runtime files
COPY --from=backend-builder /app/backend /usr/src/app

# Copy built frontend assets into nginx’s document root
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Nginx configuration: serve SPA and proxy /api to the internal Express server
RUN echo 'server {\
    listen 80;\
    location / {\
        root /usr/share/nginx/html;\
        try_files $uri $uri/ /index.html;\
    }\
    location /api/ {\
        proxy_pass http://127.0.0.1:5000; \
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection "upgrade";\
        proxy_set_header Host $host;\
        proxy_cache_bypass $http_upgrade;\
    }\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

# Start the Express server in the background and keep Nginx in the foreground
CMD ["sh", "-c", "node server.js & nginx -g 'daemon off;'"]