# syntax=docker/dockerfile:1

# Stage 1 — build the Vite client
FROM node:20-alpine AS build
WORKDIR /app
COPY client/package*.json ./client/
RUN npm --prefix client ci
COPY client ./client
RUN npm --prefix client run build

# Stage 2 — runtime with production-only server deps
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY server/package*.json ./server/
RUN npm --prefix server ci --omit=dev && npm cache clean --force

COPY server ./server
COPY --from=build /app/client/dist ./client/dist

EXPOSE 3000
CMD ["node", "server/index.js"]
