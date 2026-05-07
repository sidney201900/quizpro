# Build Stage
FROM node:20-slim AS build

# Instala openssl para o Prisma
RUN apt-get update && apt-get install -y openssl

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# Run Stage
FROM node:20-slim

# Instala openssl para o Prisma no stage final
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy compiled files and prisma client
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3005

CMD ["sh", "-c", "npx prisma db push && npm run start"]
