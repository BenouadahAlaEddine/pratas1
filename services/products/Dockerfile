FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN mkdir -p /app/data
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3002/health || exit 1
CMD ["node", "src/index.js"]
