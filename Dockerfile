# Multi-stage Dockerfile for Vimix CRM
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy dependency manifests first for caching
COPY vimix-crm-frontend/package*.json ./
RUN npm install --legacy-peer-deps

# Copy frontend source and build
COPY vimix-crm-frontend/ ./
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Install production backend dependencies
FROM node:20-alpine AS backend-dependencies
WORKDIR /app/backend

COPY vimix-crm-backend/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Final unified runtime stage with Nginx
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app

# Install Nginx and tini for process management
RUN apk add --no-cache nginx tini

# Create necessary directories
RUN mkdir -p /app/backend/uploads /run/nginx /var/log/nginx /var/lib/nginx

# Copy backend dependencies and source
COPY --from=backend-dependencies /app/backend/node_modules /app/backend/node_modules
COPY vimix-crm-backend/ /app/backend/

# Copy compiled frontend assets
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Write Nginx configuration
RUN echo 'server {\
    listen 80;\
    server_name _;\
    root /usr/share/nginx/html;\
    index index.html;\
    location / {\
        try_files $uri $uri/ /index.html;\
    }\
    location /api/ {\
        proxy_pass http://127.0.0.1:5000;\
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection "upgrade";\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }\
    location /uploads/ {\
        proxy_pass http://127.0.0.1:5000;\
    }\
    location /health {\
        proxy_pass http://127.0.0.1:5000;\
    }\
}' > /etc/nginx/http.d/default.conf

# Remove default Nginx site config
RUN rm -f /etc/nginx/conf.d/default.conf

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1

# Start backend and Nginx
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "node /app/backend/server.js & nginx -g 'daemon off;'"]