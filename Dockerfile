# Build Stage
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Run Stage
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

# Copy build files and server code
COPY --from=build /app/dist ./dist
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3001

CMD ["sh", "-c", "npx prisma generate && npx prisma db push && npx tsx server.ts"]
