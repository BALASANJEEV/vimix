# syntax=docker/dockerfile:1

## Frontend Builder
FROM node:20-alpine AS frontend-builder
WORKDIR /app/vimix-crm-frontend
COPY vimix-crm-frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY vimix-crm-frontend/ .
RUN npm run build

## Backend Builder
FROM node:20-alpine AS backend-builder
WORKDIR /app/vimix-crm-backend
COPY vimix-crm-backend/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps
COPY vimix-crm-backend/ .

## Final Runtime
FROM node:20-alpine
# Install nginx
RUN apk add --no-cache nginx

# Ensure nginx directories exist
RUN mkdir -p /run/nginx /etc/nginx/conf.d

# Create nginx configuration
RUN echo 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location /api {\n\
        proxy_pass http://127.0.0.1:5000;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection "upgrade";\n\
        proxy_set_header Host $host;\n\
        proxy_cache_bypass $http_upgrade;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

# Copy built frontend assets
COPY --from=frontend-builder /app/vimix-crm-frontend/dist /usr/share/nginx/html

# Copy backend application
COPY --from=backend-builder /app/vimix-crm-backend /usr/src/app

# Set working directory for backend
WORKDIR /usr/src/app

# Expose ports
EXPOSE 80
EXPOSE 5000

# Run backend in background, then start nginx
CMD ["sh", "-c", "mkdir -p /run/nginx && (node server.js &) && nginx -g 'daemon off;'"]