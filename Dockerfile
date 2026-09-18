FROM node:20-alpine AS frontend-builder
WORKDIR /app/vimix-crm-frontend
COPY vimix-crm-frontend/package*.json ./
RUN npm install --omit=dev
COPY vimix-crm-frontend .
RUN npm run build


FROM node:20-alpine AS backend-builder
WORKDIR /app/vimix-crm-backend
COPY vimix-crm-backend/package*.json ./
RUN npm install --legacy-peer-deps --omit=dev
COPY vimix-crm-backend .


FROM node:20-alpine AS runtime
WORKDIR /usr/src/app

# Install nginx
RUN apk add --no-cache nginx

# Directories needed by nginx
RUN mkdir -p /usr/share/nginx/html

# Copy static frontend assets
COPY --from=frontend-builder /app/vimix-crm-frontend/dist /usr/share/nginx/html

# Copy backend application and its node_modules
COPY --from=backend-builder /app/vimix-crm-backend .

# Nginx configuration
RUN printf '%s\n' \
'daemon off;' \
'user nginx;' \
'worker_processes auto;' \
'events { worker_connections 1024; }' \
'http {' \
'    include /etc/nginx/mime.types;' \
'    default_type application/octet-stream;' \
'    log_format main \'$remote_addr - $remote_user [$time_local] "\'$request\'" $status $body_bytes_sent "\'$http_referer\'" "\'$http_user_agent\'";\' \
'    access_log /var/log/nginx/access.log main;' \
'    sendfile on;' \
'    keepalive_timeout 65;' \
'    server {' \
'        listen 80;' \
'        server_name localhost;' \
'        root /usr/share/nginx/html;' \
'        location / {' \
'            try_files $uri $uri/ /index.html;' \
'        }' \
'        location /api {' \
'            proxy_pass http://127.0.0.1:5000;' \
'            proxy_set_header Host $host;' \
'            proxy_set_header X-Real-IP $remote_addr;' \
'            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' \
'            proxy_set_header X-Forwarded-Proto $scheme;' \
'        }' \
'    }' \
'}' > /etc/nginx/conf.d/default.conf

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 80

CMD ["sh", "-c", "mkdir -p /run/nginx && (node server.js &) && nginx -g 'daemon off;'"]