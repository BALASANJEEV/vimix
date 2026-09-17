FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install only production dependencies first (leverages layer caching)
COPY package*.json ./
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    elif [ -f yarn.lock ]; then \
      npm install --production; \
    else \
      npm install --production; \
    fi

# Copy the rest of the source code
COPY . .

# If a build script is defined (e.g., for TypeScript or bundling), run it
RUN if grep -q "\"build\"" package.json; then npm run build; fi


# ---------- Runtime Stage ----------
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copy the built application from the builder stage
COPY --from=builder /app ./

EXPOSE 5000

# Default command – assumes a start script is defined in package.json.
# Adjust if your entry point differs (e.g., ["node","server.js"]).
CMD ["npm", "start"]