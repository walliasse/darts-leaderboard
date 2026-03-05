# Stage 1: Build the app
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies separately to leverage Docker cache
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Copy built assets from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port (Cloud Run uses PORT env var, we'll map it in CMD)
EXPOSE 8080

# Configure Nginx to listen on the $PORT env var (standard for Cloud Run)
CMD ["sh", "-c", "sed -i 's/listen 8080/listen '\"${PORT:-8080}\"'/' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
