# 🏠 Personal Homepage

一个极简、现代的个人主页导航系统，支持实时状态检测和隐私模式。

## 🎯 在线演示

**[👉 点击查看 Demo](https://homepage-demo-nax.vercel.app)**

> 提示：在搜索框输入 `hello` 可解锁隐藏链接

## ✨ 功能特性

| 功能 | 描述 |
|------|------|
| 🟢 **实时状态检测** | 自动检测网站在线状态，快速响应不阻塞 |
| 🔒 **隐私模式** | 通过搜索框输入暗号解锁隐藏链接 |
| 🐙 **GitHub 同步** | 自动获取并展示 GitHub 仓库列表 |
| 🎨 **主题切换** | 支持亮色/暗色主题 |
| 📱 **响应式设计** | 完美适配桌面和移动设备 |
| 🏷️ **标签分类** | 按标签筛选和分组展示项目 |

## 🚀 一键部署

### Vercel（推荐，支持全部功能）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kaylonidziedzic/homepage)

### Cloudflare Pages

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/kaylonidziedzic/homepage)

> ⚠️ Cloudflare Pages 仅支持静态托管，GitHub 同步和状态检测 API 将不可用

### 腾讯云 EdgeOne

1. 登录 [EdgeOne 控制台](https://console.cloud.tencent.com/edgeone)
2. 创建 Pages 项目 → 关联 GitHub 仓库
3. 输出目录设为 `public`

> ⚠️ EdgeOne 仅支持静态托管，后端 API 功能将不可用

## 💻 本地运行

```bash
# 安装依赖
npm install

# 启动服务
npm start
```

访问 http://localhost:3000

## ⚙️ 配置说明

编辑 `data/config.json` 文件：

```json
{
  "secretCode": "your-secret",
  "profile": {
    "name": "你的名字",
    "bio": "个人简介",
    "avatar": "头像URL"
  },
  "projects": [
    {
      "id": "proj-1",
      "name": "项目名称",
      "description": "项目描述",
      "url": "https://example.com",
      "icon": "🔗",
      "tags": ["标签1", "标签2"],
      "private": false
    }
  ]
}
```

### 配置项说明

| 字段 | 说明 |
|------|------|
| `secretCode` | 隐私模式暗号，在搜索框输入可解锁隐藏链接 |
| `profile` | 个人信息配置 |
| `projects` | 项目列表 |
| `private` | 设为 `true` 则需要暗号才能看到 |

## 📁 项目结构

```
homepage/
├── data/
│   └── config.json     # 配置文件
├── public/
│   ├── js/             # 前端模块
│   ├── index.html
│   ├── styles.css
│   └── data.js         # 默认数据
├── server.js           # 后端服务
└── package.json
```

## 🌐 平台功能对比

| 功能 | Vercel | Cloudflare Pages | EdgeOne |
|------|:------:|:----------------:|:-------:|
| 静态页面 | ✅ | ✅ | ✅ |
| 实时状态检测 | ✅ | ❌ | ❌ |
| GitHub 同步 | ✅ | ❌ | ❌ |
| 隐私模式 | ✅ | ✅ | ✅ |

## 📄 License

MIT
