# Dockerfile for Vimix CRM

FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY vimix-crm-frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY vimix-crm-frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-builder

WORKDIR /app

COPY vimix-crm-backend/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY vimix-crm-backend/ ./

FROM node:20-alpine

ENV NODE_ENV=production

RUN apk add --no-cache nginx

RUN mkdir -p /run/nginx /etc/nginx/http.d /usr/share/nginx/html

COPY --from=frontend-builder /app/dist /usr/share/nginx/html
COPY --from=backend-builder /app /usr/src/app

RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    client_max_body_size 10M;\n\
\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    location /api/ {\n\
        proxy_pass http://127.0.0.1:5000;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection "upgrade";\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
    }\n\
\n\
    location /uploads/ {\n\
        alias /app/uploads/;\n\
    }\n\
}\n' > /etc/nginx/http.d/default.conf

WORKDIR /usr/src/app

EXPOSE 80

CMD ["sh", "-c", "mkdir -p /app/uploads && (node server.js &) && nginx -g 'daemon off;'"]