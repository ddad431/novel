# stage1 打包
FROM node:22.17.1-alpine AS build-stage

WORKDIR /app

# NOTE
# - 这里不复制 lock 文件，避免出现锁死系统版本的情况（即 lock 里 windows 版本，但安装环境是 linux）
# - legacy-peer-deps 忽略依赖冲突
COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build:h5


# stage2 部署
FROM nginx:stable-alpine AS pruduction-stage

COPY --from=build-stage /app/dist/build/h5 /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
