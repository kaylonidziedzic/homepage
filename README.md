# Minimal Personal Homepage

一个极简、优雅的个人主页导航系统，专为 Serverless 部署设计。

![Screenshot](public/background.jpg)

## ✨ 特性

- **极速部署**：支持 Vercel、Cloudflare Pages、EdgeOne 等平台一键部署。
- **配置简单**：所有数据存储在 `data/config.json` 中，修改文件即可更新内容。
- **GitHub 同步**：自动获取并展示你的 GitHub 仓库列表。
- **现代化设计**：玻璃拟态风格，响应式布局，极佳的视觉体验。
- **完全免费**：无需购买服务器，依托免费的 Serverless 平台即可运行。

## 🚀 快速开始

### 1. Fork 本项目
点击右上角的 **Fork** 按钮，将代码复制到你的 GitHub 仓库。

### 2. 修改配置
编辑 `data/config.json` 文件，填入你的个人信息和导航链接。

```json
{
  "profile": {
    "name": "你的名字",
    "bio": "全栈开发者",
    ...
  },
  "projects": [
    ...
  ]
}
```

### 3. 一键部署
推荐使用 **Vercel** 进行部署：

1.  登录 [Vercel](https://vercel.com)。
2.  点击 **Add New Project**。
3.  导入你 Fork 的仓库。
4.  点击 **Deploy**。

部署完成后，你的个人主页就上线了！

> 更多部署方式（Cloudflare / EdgeOne）请参考 [DEPLOY.md](DEPLOY.md)。

## ⚙️ 功能说明

### 数据管理
本项目采用 **GitOps** 模式管理数据。由于 Serverless 环境的特性，网页上的“添加/编辑”功能已被禁用（只读模式）。
如需更新内容，请直接在 GitHub 上编辑 `data/config.json` 文件并提交。

### GitHub 集成
配置中开启 `githubConfig` 后，系统会自动拉取你的置顶或最新仓库展示。
如果遇到 API 限制，可以在 Vercel 环境变量或配置文件中配置 Token。

## 🛠️ 本地开发

如果你想在本地预览或修改代码：

```bash
# 安装依赖
npm install

# 启动服务
npm start
```

打开浏览器访问 `http://localhost:3000`。

## 📄 许可证

MIT License
