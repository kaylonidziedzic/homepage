# 使用 Node.js 环境
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 1. 安装依赖 (利用缓存)
COPY package.json ./
RUN npm install --production

# 2. 拷贝后端代码
COPY server.js ./

# 3. 拷贝前端文件到 public 目录
COPY public ./public

# 4. 创建数据目录
RUN mkdir data
VOLUME /app/data

# 暴露端口
EXPOSE 3000

# 启动
CMD ["npm", "start"]
