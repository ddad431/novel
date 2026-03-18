# 设置基础镜像 (项环境)
FROM node:22.17.1-alpine

# 设置项目所在目录
WORKDIR /app

# 复制本地代码到镜像
#
# NOTE
# - 不要直接复制整个项目到镜像
#   - 这样的后果是每次代码改动就代表缓存失效，即需要重新复制完整项目
# - 将依赖更新与代码改动相分离
#   - 假如检查到依赖配置没有改变 (COPY package.json)，那么用对应依赖配置缓
#   存。依赖配置缓存没有改变，那就跳过 (RUN npm install)。代码改动，COPY . .
#   缓存失效，重新执行 COPY，但由于我们在 .dockerignore 配置了不复制对应的依
#   赖，所以我们只需要重新复制代码部分就好了。
#   - NOTE
#   COPY . . 不能在 COPY package.json ./ 前执行。因为 docker 的缓存检查是线性
#   检查的，即前一步缓存失效 (COPY . .)，那后面就就默认失效。（因为 docker 无
#   法保证后面的命令是否依赖于前面的内容)
COPY package.json ./
RUN npm install
COPY . .

# 生成 prisma 客户端
# - prisma 客户端依赖于文件更改，也就是说这玩意不是一次性的，所以放在 dockerfile 这里
RUN npx prisma generate

# 设置监听端口
# - 感觉这个相比 compose 那里设置的端口映射多余了。我既然走了端口映射，就不一定走你 EXPOSE 的这个吧
# - 不过好像还有其他作用，但是当前用不上。不过，都用 ${PORT} 应该没问题了吧
EXPOSE ${PORT}

# 启动服务
CMD ["npm", "run", "dev"]
