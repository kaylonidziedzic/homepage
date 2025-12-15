# 部署指南 (Deployment Guide)

本项目已优化，支持部署到各大 Serverless/静态网站托管平台。

## ⚠️ 重要说明

本项目采用 **只读模式 (Read-Only)** 部署。
*   **数据存储**：数据存储在 `data/config.json` 文件中。
*   **如何修改**：网页上的由“添加/编辑”功能**不可用**。你需要直接修改 GitHub 仓库里的 `data/config.json` 文件，提交后系统会自动重新部署更新。

---

## 1. Vercel 部署 (推荐)

最简单、最快的方式。

1.  注册/登录 [Vercel](https://vercel.com)。
2.  点击 "Add New..." -> "Project"。
3.  导入你的 GitHub 仓库。
4.  **Framework Preset** 选 `Other` 即可。
5.  **Build Command** 和 **Output Directory** 留空 (默认)。
6.  点击 **Deploy**。

部署完成后，Vercel 会自动识别 `vercel.json` 配置，API 和静态页面都能正常工作。

---

## 2. Cloudflare Pages 部署

如果你想用 Cloudflare Pages：

1.  登录 Cloudflare Dashboard。
2.  进入 **Workers & Pages** -> **Create Application** -> **Pages** -> **Connect to Git**。
3.  选择你的仓库。
4.  **Build settings**:
    *   **Framework preset**: None / Clouflare Pages
    *   **Build command**: `npm install` (或者空)
    *   **Output directory**: `public`
5.  点击 **Save and Deploy**。

**注意**：
*   这种方式部署的是纯静态页面。
*   `/api/github/repos` (GitHub 自动同步功能) **将无法使用**，因为它需要后端 Node.js 环境。
*   如果需要 API 功能，你需要使用 `Cloudflare Workers` 配合，或者直接用 Vercel。

---

## 3. 腾讯云 EdgeOne 部署

1.  登录腾讯云 EdgeOne 控制台。
2.  创建站点 -> Pages (静态托管)。
3.  关联 GitHub 仓库。
4.  **构建配置**:
    *   **构建命令**: `npm install` (如有必要)
    *   **输出目录**: `public`
5.  部署。

**注意**：与 Cloudflare Pages 类似，这种方式仅托管静态文件 (HTML/CSS/JS)，后端 API 功能 (GitHub 同步) 将失效。

---

## 4. 本地运行 (开发/测试)

```bash
# 安装依赖
npm install

# 启动服务
npm start
```
访问 `http://localhost:3000`
