# 1. Derleme Aşaması
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 2. Yayınlama Aşaması (Nginx ile ultra hızlı ve sıfır bellek tüketimi)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA yönlendirme ayarı (Tüm sayfalar index.html'e yönlenir)
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Cloud Run için varsayılan port 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
