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

FROM node:20-alpine AS production
WORKDIR /usr/src/app
COPY --from=frontend-builder /app/vimix-crm-frontend/dist /usr/share/nginx/html
COPY --from=backend-builder /app/vimix-crm-backend/server.js .
COPY --from=backend-builder /app/vimix-crm-backend/package*.json ./
RUN npm install --production

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["sh", "-c", "node server.js & nginx -g 'daemon off;'" ]