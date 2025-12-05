FROM nginx:1.27-alpine

# 拷贝静态资源
COPY index.html /usr/share/nginx/html/index.html
COPY styles.css /usr/share/nginx/html/styles.css
COPY app.js /usr/share/nginx/html/app.js
COPY data.js /usr/share/nginx/html/data.js
COPY README.md /usr/share/nginx/html/README.md

# 使用精简的 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
