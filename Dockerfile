# Build Stage
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# Run Stage
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy compiled files and prisma client
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push && npm run start"]
