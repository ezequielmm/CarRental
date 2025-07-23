# Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json
COPY car-rental-frontend/package.json ./

# Install dependencies
RUN npm install --force

# Copy source code
COPY car-rental-frontend/ ./

# Build the Angular application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built application from build stage
COPY --from=build /app/dist/car-rental-frontend /usr/share/nginx/html

# Copy nginx configuration
RUN echo 'server {\
    listen 80;\
    server_name localhost;\
    root /usr/share/nginx/html;\
    index index.html;\
    \
    location / {\
        try_files $uri $uri/ /index.html;\
    }\
    \
    location /api {\
        proxy_pass http://backend:5000;\
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection '\''upgrade'\'';\
        proxy_set_header Host $host;\
        proxy_cache_bypass $http_upgrade;\
    }\
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]