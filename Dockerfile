FROM node:20-alpine AS frontend-builder
WORKDIR /app/vimix-crm-frontend
COPY vimix-crm-frontend/package*.json ./
RUN npm install
COPY vimix-crm-frontend ./
RUN npm run build

FROM node:20-alpine AS backend-builder
WORKDIR /app/vimix-crm-backend
COPY vimix-crm-backend/package*.json ./
RUN npm install
COPY vimix-crm-backend ./

FROM nginx:alpine AS production
RUN apk add --no-cache nodejs npm
RUN mkdir -p /run/nginx /etc/nginx/http.d /etc/nginx/conf.d
COPY --from=frontend-builder /app/vimix-crm-frontend/dist /usr/share/nginx/html
COPY --from=backend-builder /app/vimix-crm-backend/server.js /usr/src/app/
COPY --from=backend-builder /app/vimix-crm-backend/package*.json /usr/src/app/
WORKDIR /usr/src/app
RUN npm install --production

COPY nginx.conf /etc/nginx/http.d/default.conf

EXPOSE 80
CMD ["sh", "-c", "mkdir -p /run/nginx && node server.js & nginx -g 'daemon off;'"]
