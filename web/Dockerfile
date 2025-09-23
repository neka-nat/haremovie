FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable

COPY package.json ./
COPY package-lock.json* ./

RUN npm ci

COPY ./ ./

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

FROM nginx:alpine AS runner

RUN rm -f /etc/nginx/conf.d/default.conf \
 && printf '%s\n' \
'server {' \
'  listen       8080 default_server;' \
'  listen       [::]:8080 default_server;' \
'  server_name  _;' \
'  root         /usr/share/nginx/html;' \
'  index        index.html;' \
'' \
'  # ハッシュ付きファイルを長期キャッシュ' \
'  location ~* \.(?:js|mjs|css|svg|png|jpe?g|gif|webp|ico|woff2?)$ {' \
'    try_files $uri =404;' \
'    expires 1y;' \
'    add_header Cache-Control "public, immutable";' \
'  }' \
'' \
'  # SPA ルーティング（/xxx を index.html にフォールバック）' \
'  location / {' \
'    try_files $uri /index.html;' \
'  }' \
'}' > /etc/nginx/conf.d/app.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
