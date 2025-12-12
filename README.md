# 🏠 个人主页 & 项目导航

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Stars](https://img.shields.io/github/stars/yourusername/homepage?style=social)

一个现代化、高颜值的个人主页和项目导航系统

[在线演示](#) | [快速开始](#-快速开始) | [部署指南](#-部署方式)

</div>

---

## ✨ 特性

### 🎨 设计与体验
- 🍎 **iOS 风格设计** - 清爽的磨砂玻璃质感，支持浅色壁纸
- 📱 **完美移动端适配** - 响应式设计，手机/平板/电脑完美显示
- ⚡ **流畅动画** - 卡片悬停效果，模态框动画
- 🎯 **直观交互** - 搜索、标签筛选、分组显示

### 🚀 核心功能
- 👤 **个人信息展示** - 头像、简介、位置、社交链接
- 📦 **项目管理** - 手动添加项目，支持状态、技术栈标签
- 🐙 **GitHub 自动同步** - 一键导入 GitHub 仓库，自动更新 Stars
- 🔍 **智能搜索** - 实时搜索项目名称、标签、描述
- 📂 **自动分组** - 根据标签自动归类显示
- 💾 **多种存储方案** - 支持 SQLite、本地存储、云端同步

### 🔒 数据与安全
- 🔐 **密码保护** - 编辑功能需要解锁
- 📤 **导入导出** - 支持 JSON 格式备份和迁移
- 🌐 **多端同步** - 根据部署方式支持跨设备同步
- 🔄 **自动备份** - 数据保存到服务器，断网时本地缓存

---

## 🛠️ 技术栈

### 前端
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

- **原生技术栈** - 无框架依赖，轻量高效
- **响应式设计** - Flexbox + Grid 布局
- **现代特性** - ES6+、Fetch API、LocalStorage

### 后端
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=white)

- **Node.js 18+** - 轻量级运行环境
- **Express 4.x** - 简洁的 Web 框架
- **SQLite 3** - 嵌入式数据库，零配置

### DevOps
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat&logo=github-actions&logoColor=white)

---

## 📸 预览

### 桌面端
![Desktop Preview](https://via.placeholder.com/800x500?text=Desktop+Preview)

### 移动端
![Mobile Preview](https://via.placeholder.com/375x667?text=Mobile+Preview)

---

## 🚀 快速开始

### 前置要求
- Node.js >= 18.0.0
- npm 或 yarn

### 本地运行

```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/homepage.git
cd homepage

# 2. 安装依赖
npm install

# 3. 启动服务
npm start

# 4. 访问应用
# 浏览器打开 http://localhost:3000
```

---

## 🌐 部署方式

### 📊 部署方案对比

| 部署方式 | 难度 | 成本 | 数据同步 | 外网访问 | 推荐度 |
|---------|------|------|---------|---------|--------|
| **Docker (云服务器)** | ⭐⭐ | 💰 (服务器费用) | ✅ 完全同步 | ✅ | ⭐⭐⭐⭐⭐ |
| **Vercel + 数据库** | ⭐⭐⭐ | 免费 | ✅ 完全同步 | ✅ | ⭐⭐⭐⭐ |
| **纯静态部署** | ⭐ | 免费 | ⚠️ 仅本地 | ✅ | ⭐⭐⭐ |
| **内网穿透** | ⭐⭐ | 免费 | ✅ 完全同步 | ✅ | ⭐⭐ |

---

### 🐳 方式一：Docker 部署（推荐）

**适用场景**：有云服务器，需要完全的数据控制和多端同步

**数据同步方式**：
- ✅ 数据存储在服务器 SQLite 数据库
- ✅ 所有设备访问同一域名，数据完全同步
- ✅ 换设备/浏览器无需重新配置

#### 部署步骤

```bash
# 1. 克隆项目到服务器
git clone https://github.com/yourusername/homepage.git
cd homepage

# 2. 构建镜像
docker build -t personal-homepage .

# 3. 运行容器
docker run -d \
  --name homepage \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  personal-homepage

# 4. 配置 Nginx 反向代理（可选）
# 绑定域名，支持 HTTPS
```

#### Docker Compose 部署

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  homepage:
    build: .
    container_name: personal-homepage
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

启动：
```bash
docker-compose up -d
```

#### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name nav.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### ☁️ 方式二：Vercel 部署

**适用场景**：快速部署，需要外网访问，但当前版本需要额外数据库

**数据同步方式**：
- ⚠️ Vercel 不支持持久化文件存储（SQLite 会在重新部署时丢失）
- 🔧 需要配置外部数据库（Vercel Postgres / MongoDB）
- ✅ 配置后支持多端同步

#### 快速部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/homepage)

#### 手动部署

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录 Vercel
vercel login

# 3. 部署
vercel

# 4. 配置数据库（二选一）
# 方案 A: Vercel Postgres
vercel postgres create

# 方案 B: MongoDB Atlas (免费)
# 访问 https://www.mongodb.com/cloud/atlas
```

**注意**：目前版本使用 SQLite，不适合直接部署到 Vercel。建议：
1. 使用 Docker 部署
2. 或等待我们提供 Vercel 适配版本（使用 Vercel KV 或 Postgres）

---

### 📄 方式三：纯静态部署

**适用场景**：不需要后端，数据存储在浏览器本地

**数据同步方式**：
- ⚠️ 数据仅存储在浏览器 LocalStorage
- ❌ 换浏览器/设备需要手动导出导入 JSON
- ⚠️ GitHub 同步功能受 API 限额影响

#### 部署到 GitHub Pages

```bash
# 1. 创建纯静态版本
mkdir static-version
cp -r public/* static-version/

# 2. 修改 app.js 中的 loadFromAPI 函数
# 注释掉 API 调用，改为从 localStorage 读取

# 3. 推送到 gh-pages 分支
cd static-version
git init
git checkout -b gh-pages
git add .
git commit -m "Deploy to GitHub Pages"
git remote add origin https://github.com/yourusername/homepage.git
git push -f origin gh-pages

# 4. 在 GitHub 仓库设置中启用 GitHub Pages
# Settings -> Pages -> Source: gh-pages branch
```

**访问地址**：`https://yourusername.github.io/homepage/`

---

### 🔗 方式四：内网穿透

**适用场景**：在本地运行，偶尔需要外网访问

**数据同步方式**：
- ✅ 数据存储在本地 SQLite
- ✅ 通过内网穿透域名访问，数据完全同步
- ⚠️ 需要保持本地服务运行

#### 使用 Cloudflare Tunnel（免费）

```bash
# 1. 安装 cloudflared
# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# 2. 登录 Cloudflare
cloudflared tunnel login

# 3. 创建隧道
cloudflared tunnel create homepage

# 4. 配置路由
cloudflared tunnel route dns homepage nav.yourdomain.com

# 5. 运行隧道
cloudflared tunnel --config config.yml run homepage
```

#### 使用 frp（需要自己的公网服务器）

```bash
# 服务器端
./frps -c frps.ini

# 本地端
./frpc -c frpc.ini
```

---

## ⚙️ 配置说明

### 个人信息配置

修改 `public/data.js` 中的 `profile` 对象：

```javascript
profile: {
  name: "你的名字",
  avatar: "头像 URL 或使用 DiceBear API",
  bio: "一句话介绍",
  location: "所在地",
  socials: [
    { name: "GitHub", icon: "🐙", url: "https://github.com/yourusername" },
    { name: "Blog", icon: "✍️", url: "https://yourblog.com" },
    { name: "Email", icon: "📧", url: "mailto:your@email.com" }
  ]
}
```

### GitHub 同步配置

#### 方式一：网页配置（推荐）

1. 访问你的主页
2. 点击底部 🔒 解锁（输入任意密码）
3. 点击底部 🐙 GitHub 按钮
4. 填写配置：
   - GitHub 用户名（必填）
   - GitHub Token（可选，提高 API 限额）
   - 过滤选项（排除 Fork/私有仓库）
5. 点击"测试连接"验证
6. 点击"保存并同步"

#### 方式二：获取 GitHub Token

1. 访问 [GitHub Settings - Tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 选择权限：
   - ✅ `public_repo` - 访问公开仓库
   - ✅ `repo` - 访问私有仓库（可选）
4. 生成并复制 Token

**API 限额说明**：
- 不使用 Token：60 次/小时
- 使用 Token：5000 次/小时

### 环境变量

创建 `.env` 文件（可选）：

```bash
# 服务器端口
PORT=3000

# Node 环境
NODE_ENV=production

# GitHub Token（服务器端使用）
GITHUB_TOKEN=your_github_token_here
```

---

## 📖 使用指南

### 添加项目

1. 点击底部 🔒 解锁
2. 点击底部 ＋ 按钮
3. 填写项目信息：
   - 项目名称
   - 项目链接
   - 图标（Emoji 或图片链接）
   - 描述
   - 状态（进行中/已完成/运行中等）
   - 技术栈（逗号分隔）
   - 标签分类（用于分组）
4. 点击"保存"

### 编辑/删除项目

1. 解锁后，每个**手动添加**的项目右上角会显示 ✎ 按钮
2. 点击 ✎ 进入编辑模式
3. 修改后点击"保存"，或点击"删除"

**注意**：GitHub 同步的项目不可编辑（显示 🐙 标识）

### 搜索与筛选

- **搜索框**：输入关键词，实时搜索项目名称、标签、描述
- **标签筛选**：点击顶部标签快速筛选分类
- **分组显示**：默认按标签自动分组展示

### 导入导出

#### 导出备份
1. 点击底部 ↓ 按钮
2. 自动下载 `nav_backup.json` 文件

#### 导入恢复
1. 点击底部 ↑ 按钮
2. 选择之前导出的 JSON 文件
3. 数据会自动同步到服务器

---

## 🔧 开发指南

### 项目结构

```
homepage/
├── public/                 # 前端静态文件
│   ├── index.html         # 主页面
│   ├── styles.css         # 样式文件
│   ├── app.js             # 主要逻辑
│   ├── data.js            # 默认数据
│   └── background.jpg     # 背景图
├── server.js              # 后端服务器
├── package.json           # 项目依赖
├── Dockerfile             # Docker 配置
├── docker-compose.yml     # Docker Compose 配置
├── .dockerignore          # Docker 忽略文件
├── .gitignore             # Git 忽略文件
└── README.md              # 项目文档
```

### 本地开发

```bash
# 安装依赖
npm install

# 开发模式（自动重启）
npm install -g nodemon
nodemon server.js

# 生产模式
npm start
```

### API 接口

#### 获取数据
```
GET /api/data
Response: { profile, githubConfig, projects }
```

#### 保存数据
```
POST /api/data
Body: { profile, githubConfig, projects }
Response: { success: true }
```

#### GitHub 仓库列表
```
GET /api/github/repos?username=xxx&token=xxx
Response: [{ id, name, description, stars, ... }]
```

---

## 🎨 自定义样式

### 修改配色

编辑 `public/styles.css` 中的 CSS 变量：

```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.75);
  --glass-border: rgba(255, 255, 255, 0.6);
  --accent: #007aff;  /* 主题色 */
  --text-main: #333;
  --text-sub: #666;
}
```

### 更换背景图

1. 将图片放到 `public/` 目录
2. 修改 `public/styles.css`：

```css
:root {
  --bg-image: url('./your-background.jpg');
}
```

---

## ❓ 常见问题

### Q1: 如何修改解锁密码？

目前版本输入任意密码即可解锁。如需真正的密码保护，修改 `public/app.js`：

```javascript
el.btnUnlock.addEventListener("click", () => {
  const pwd = prompt("请输入密码解锁:");
  if(pwd === "your_secure_password") {  // 修改这里
    unlocked = true;
    el.btnUnlock.textContent = "🔓";
    render();
  } else {
    alert("密码错误");
  }
});
```

### Q2: 换浏览器后数据丢失怎么办？

**如果使用 Docker/云服务器部署**：
- 访问同一个域名，数据自动同步
- 无需任何操作

**如果使用静态部署**：
1. 在旧浏览器点击 ↓ 导出数据
2. 在新浏览器点击 ↑ 导入数据

### Q3: GitHub 同步失败怎么办？

检查：
1. GitHub 用户名是否正确
2. 是否超过 API 限额（未使用 Token 时 60 次/小时）
3. 网络是否能访问 GitHub API
4. 查看浏览器控制台（F12）的错误信息

### Q4: 如何定期自动同步 GitHub？

可以使用 GitHub Actions 定时触发同步（需要服务器端实现）。

### Q5: 支持其他数据库吗？

目前使用 SQLite。如需 MySQL/PostgreSQL，修改 `server.js`：

```javascript
// 替换 sqlite3 为 mysql2 或 pg
const mysql = require('mysql2/promise');
// 修改数据库连接和查询逻辑
```

---

## 🛣️ Roadmap

- [ ] 暗色主题支持
- [ ] 多用户系统
- [ ] GitLab / Gitee 同步
- [ ] 项目统计看板
- [ ] PWA 支持（离线访问）
- [ ] 自定义主题编辑器
- [ ] Docker 一键脚本
- [ ] Vercel Postgres 适配

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 License

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- 设计灵感来自 iOS / macOS
- 图标来自 DiceBear Avatars
- 感谢所有贡献者

---

## 📮 联系方式

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your@email.com
- Blog: https://yourblog.com

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐ Star！**

Made with ❤️ by [Your Name](https://github.com/yourusername)

</div>
