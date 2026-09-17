FROM node:22-alpine AS frontend-builder
WORKDIR /app/vimix-crm-frontend
COPY vimix-crm-frontend/package*.json ./
RUN npm ci
COPY vimix-crm-frontend/ ./
RUN npm run build

FROM node:22-alpine AS backend-builder
WORKDIR /app/vimix-crm-backend
COPY vimix-crm-backend/package*.json ./
RUN npm ci
COPY vimix-crm-backend/ ./

FROM node:22-alpine
RUN apk add --no-cache nginx wget curl && \
    mkdir -p /run/nginx /etc/nginx/http.d /usr/src/app/uploads /var/www/html

# Copy backend from builder (includes source + node_modules)
COPY --from=backend-builder /app/vimix-crm-backend/ /usr/src/app

# Frontend static build
COPY --from=frontend-builder /app/vimix-crm-frontend/dist /var/www/html

# Nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

WORKDIR /usr/src/app
ENV NODE_ENV=production \
    PORT=5000
EXPOSE 80 5000

# Create uploads directory and set permissions
RUN mkdir -p /usr/src/app/uploads && chmod 755 /usr/src/app/uploads

# Create startup script with fixed nginx daemon directive and MongoDB wait loop
RUN echo '#!/bin/sh\n\n# Wait for MongoDB to be available (if using MongoDB)\nif [ -n "$MONGO_URI" ]; then\n  echo "Waiting for MongoDB..."\n  for i in $(seq 1 30); do\n      if wget -qO- --timeout=2 http://mongo:27017/health >/dev/null 2>&1; then\n          echo "MongoDB is ready"\n          break\n      fi\n      sleep 2\n  done\nfi\n\n# Start nginx in the background\nginx -g "daemon off;" &\nNGINX_PID=$!\n\n# Wait for nginx to be ready (max 10 seconds)\nfor i in $(seq 1 10); do\n    if wget -qO- http://127.0.0.1:80/ >/dev/null 2>&1; then\n        break\n    fi\n    sleep 1\ndone\n\n# Start the Node.js application and capture any startup errors\nnode server.js 2>&1\nRC=$?\nkill $NGINX_PID 2>/dev/null\necho "Node.js server exited with code $RC"\nexit $RC' > /start.sh && chmod +x /start.sh

# Health check – wait for the Node.js server to be ready
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD wget -qO- http://127.0.0.1:5000/health || exit 1

CMD ["/start.sh"]
