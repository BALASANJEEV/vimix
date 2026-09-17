FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install frontend dependencies (production only)
COPY vimix-crm-frontend/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy source and build
COPY vimix-crm-frontend/ .
RUN npm run build


FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

# Install backend dependencies (production only)
COPY vimix-crm-backend/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy source (no build step needed for plain Express)
COPY vimix-crm-backend/ .


FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Install nginx (serves the frontend and proxies /api)
RUN apk add --no-cache nginx && \
    mkdir -p /run/nginx && \
    mkdir -p /etc/nginx/http.d && \
    rm -f /etc/nginx/http.d/default.conf

# Copy backend runtime files
COPY --from=backend-builder /app/backend /usr/src/app

# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Nginx configuration: serve SPA and proxy API to the internal Express server
RUN echo 'server {\
    listen 80;\
    location / {\
        root /usr/share/nginx/html;\
        try_files $uri $uri/ /index.html;\
    }\
    location /api/ {\
        proxy_pass http://127.0.0.1:5000; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_cache_bypass $http_upgrade; \
    }\
}' > /etc/nginx/http.d/default.conf

EXPOSE 80

# Start Express in background and keep Nginx in foreground
CMD ["sh", "-c", "node server.js & nginx -g 'daemon off;'"]