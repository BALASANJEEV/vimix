# Build Stage – Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install dependencies
COPY vimix-crm-frontend/package*.json ./
RUN npm ci --legacy-peer-deps

# Build frontend
COPY vimix-crm-frontend/ .
RUN npm run build

# Build Stage – Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

# Install build tools for native modules
RUN apk add --no-cache python3 make g++ gcc libc-dev sqlite-dev

# Install backend deps
COPY vimix-crm-backend/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy backend source
COPY vimix-crm-backend/ .

# Runtime Stage – Final image
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
ENV MONGO_URI=mongodb://localhost:27017/vimix
WORKDIR /usr/src/app

# Install runtime dependencies (Nginx & SQLite)
RUN apk add --no-cache nginx sqlite && \
    mkdir -p /run/nginx && \
    mkdir -p /etc/nginx/conf.d && \
    rm -f /etc/nginx/conf.d/default.conf

# Copy backend runtime files
COPY --from=backend-builder /app/backend /usr/src/app

# Copy frontend assets into Nginx document root
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Configure Nginx to serve the React app and proxy /api to Express
RUN echo 'server {\n    listen 80;\n    location / {\n        root /usr/share/nginx/html;\n        try_files $uri $uri/ /index.html;\n    }\n    location /api/ {\n        proxy_pass http://127.0.0.1:5000;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection "upgrade";\n        proxy_set_header Host $host;\n        proxy_cache_bypass $http_upgrade;\n    }\n}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

# Start Express in background and Nginx in foreground
CMD ["sh", "-c", "node server.js & nginx -g 'daemon off;'" ]
