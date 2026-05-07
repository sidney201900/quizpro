# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all files and build the project
COPY . .
RUN npm run build

# Run stage
FROM nginx:stable-alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing and API proxy
RUN echo 'server { \
    listen 80; \
    location /api/ { \
        proxy_pass http://api:3001/api/; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $$http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $$host; \
        proxy_cache_bypass $$http_upgrade; \
    } \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $$uri $$uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
