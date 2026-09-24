FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY vimix-crm-frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY vimix-crm-frontend/ ./
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM node:20-alpine

ENV NODE_ENV=production
ENV PORT=5000

RUN apk add --no-cache nginx ca-certificates

WORKDIR /app

COPY vimix-crm-backend/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

COPY vimix-crm-backend/ ./

RUN mkdir -p uploads /run/nginx /usr/share/nginx/html

COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/http.d/default.conf
RUN nginx -t

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --spider --quiet http://127.0.0.1/ || exit 1

CMD ["sh", "-c", "mkdir -p /run/nginx && node server.js & nginx -g 'daemon off;'"]