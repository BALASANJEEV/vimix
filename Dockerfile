FROM node:20-alpine AS frontend-builder
WORKDIR /app/vimix-crm-frontend
COPY vimix-crm-frontend/package*.json ./
RUN npm ci
COPY vimix-crm-frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-builder
WORKDIR /app/vimix-crm-backend
COPY vimix-crm-backend/package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine
RUN apk add --no-cache nginx wget && \
    mkdir -p /run/nginx /etc/nginx/http.d /usr/src/app/uploads /var/www/html

# Copy backend SOURCE first
COPY vimix-crm-backend/ /usr/src/app
# Then overlay production node_modules from the builder (so they are not clobbered)
COPY --from=backend-builder /app/vimix-crm-backend/node_modules /usr/src/app/node_modules
# Frontend static build
COPY --from=frontend-builder /app/vimix-crm-frontend/dist /var/www/html

RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /var/www/html;\n\
    index index.html;\n\
    client_max_body_size 20m;\n\
    location /api/ {\n\
        proxy_pass http://127.0.0.1:5000;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
    }\n\
    location /uploads/ {\n\
        proxy_pass http://127.0.0.1:5000;\n\
        proxy_set_header Host $host;\n\
    }\n\
    location /health {\n\
        proxy_pass http://127.0.0.1:5000;\n\
    }\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/http.d/default.conf

WORKDIR /usr/src/app
ENV NODE_ENV=production \
    PORT=5000
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/health || exit 1

# Start script: run node in background with restart loop, nginx in foreground (PID 1)
CMD ["sh", "-c", "mkdir -p /run/nginx /usr/src/app/uploads; (while true; do node server.js; sleep 2; done &) ; exec nginx -g 'daemon off;'"]
