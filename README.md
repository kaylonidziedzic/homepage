# 服务导航主页

一个纯静态的导航页，方便集中管理多台服务器上的服务。支持用途分组、搜索/筛选、收藏、快速复制、二维码、新开标签、导入导出 JSON，以及登录保护的编辑模式。

## 快速开始
1. 打开 `index.html` 即可使用，初始内容来自 `data.js` 中的示例数据。
2. 搜索栏支持名称、描述、服务器、标签模糊匹配；下拉框可按服务器或标签筛选；可切换“仅查看收藏”。
3. 点击卡片上的标签可立即应用过滤，点击星标可收藏，复制按钮会将链接写入剪贴板，二维码按钮会生成可扫码的图片。
4. 需要导入/导出或新增服务时，先点击“解锁编辑”，首次会要求设置密码。解锁后可导出当前数据到 `services.json`，或从 JSON 文件导入，或在页面底部使用表单添加服务。
5. 本地变更会保存在浏览器 `localStorage` 中，可随时导出备份；清空浏览器缓存可回到默认数据。

## 使用说明与操作步骤
1. **浏览与跳转**：在主页按用途分组展示服务，点击卡片标题即可在新标签打开服务，复制/二维码按钮可快速分享。
2. **搜索与筛选**：搜索框实时模糊匹配名称、描述、服务器、标签；下方芯片标签和筛选栏可按服务器、标签、收藏快速组合过滤。
3. **收藏常用**：点击星标将服务加入“收藏”，切换“仅查看收藏”后仅显示常用条目。
4. **编辑模式**：点击“解锁编辑”并设置一次性密码后，可导出当前数据、从 JSON 导入或在页面底部表单添加服务。密码仅保存在本地。
5. **JSON 导入/导出**：导出会生成 `services.json`，导入时需保持字段名一致；支持覆盖当前数据并立即在页面呈现。
6. **数据备份**：所有操作会写入浏览器 `localStorage`。如需恢复默认示例，清除站点缓存或重新导入初始数据即可。

## 部署方案
### Linux/本地静态部署
- 直接放置到任意静态目录并由 Nginx/Apache/Node 静态服务托管，例如：
  ```nginx
  server {
    listen 80;
    server_name nav.example.com;
    root /var/www/service-nav;
    index index.html;
  }
  ```
- 也可本地预览：`python -m http.server 8000` 后访问 `http://localhost:8000`。

### Vercel 一键部署
1. Fork 或上传本仓库到自己的 GitHub/GitLab。
2. 在 Vercel 选择 "Add New Project" → "Import" 该仓库。
3. Framework 选择 **Other**，Output Directory 留空（默认根目录），Build Command 留空（纯静态无需构建）。
4. 点击 Deploy，完成后即可获得线上访问地址。

### Cloudflare Pages 部署
1. 在 Cloudflare Pages 选择 "Create a project" → 连接包含本项目的仓库。
2. Framework Preset 选择 **None**，Build command 为空，Build output directory 设为 `/`（根目录）。
3. 保存后自动构建并分配 `*.pages.dev` 访问域名，可在自定义域名上绑定。

### Docker 部署
1. 构建镜像：`docker build -t service-nav .`
2. 运行容器：`docker run -d --name service-nav -p 8080:80 service-nav`
3. 访问 `http://localhost:8080` 即可作为 demo 或正式环境使用，可结合反向代理/HTTPS。

## 快速 Demo 测试
- 本仓库未托管公网 Demo，可按需本地或容器方式自启。
- 若未准备服务器，可直接使用上文 Docker 命令或 `python -m http.server` 本地启动，浏览器访问即可完整体验搜索、筛选、导入导出等功能。

## 自定义数据格式
导入/导出的 JSON 形如：
```json
{
  "servers": [
    { "name": "atlas-01", "note": "核心生产" }
  ],
  "services": [
    {
      "id": "svc-1",
      "name": "Prometheus",
      "description": "生产监控数据采集",
      "purpose": "监控",
      "server": "atlas-01",
      "url": "https://atlas-01.internal:9090",
      "port": 9090,
      "auth": "basic / ops",
      "tags": ["prod", "monitoring"]
    }
  ]
}
```
`id` 需唯一；`tags` 为数组；`port` 可省略。

## 安全提醒
- 编辑密码仅保存在当前浏览器的 `localStorage`，不与服务端交互。
- 二维码使用 `api.qrserver.com` 在线生成，如需内网完全离线，可替换为自建二维码接口或接入内置库。
- 建议将页面部署在内网服务器，必要时结合反向代理/HTTP 认证限制访问。

