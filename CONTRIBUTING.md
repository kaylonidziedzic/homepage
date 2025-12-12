# 贡献指南

感谢你考虑为本项目做出贡献！

## 如何贡献

### 报告 Bug

如果你发现了 Bug，请创建一个 Issue，包含以下信息：

1. **Bug 描述**：清晰简洁地描述问题
2. **复现步骤**：如何复现这个问题
3. **期望行为**：你期望发生什么
4. **实际行为**：实际发生了什么
5. **环境信息**：
   - 操作系统
   - Node.js 版本
   - 浏览器版本
   - 部署方式

### 提出新功能

如果你有新功能的想法，请创建一个 Issue，说明：

1. **功能描述**：详细描述这个功能
2. **使用场景**：这个功能解决什么问题
3. **实现建议**：（可选）你认为如何实现

### 提交代码

1. **Fork 仓库**

   点击页面右上角的 "Fork" 按钮

2. **克隆到本地**

   ```bash
   git clone https://github.com/your-username/homepage.git
   cd homepage
   ```

3. **创建分支**

   ```bash
   git checkout -b feature/your-feature-name
   ```

   分支命名规范：
   - `feature/xxx` - 新功能
   - `fix/xxx` - Bug 修复
   - `docs/xxx` - 文档更新
   - `refactor/xxx` - 代码重构

4. **开发和测试**

   ```bash
   npm install
   npm start
   ```

   确保：
   - 代码符合项目风格
   - 功能正常工作
   - 没有引入新的 Bug

5. **提交更改**

   ```bash
   git add .
   git commit -m "feat: 添加 xxx 功能"
   ```

   提交信息规范：
   - `feat: 新功能`
   - `fix: Bug 修复`
   - `docs: 文档更新`
   - `style: 代码格式调整`
   - `refactor: 代码重构`
   - `test: 测试相关`
   - `chore: 构建/工具相关`

6. **推送到 GitHub**

   ```bash
   git push origin feature/your-feature-name
   ```

7. **创建 Pull Request**

   - 访问你 Fork 的仓库
   - 点击 "New Pull Request"
   - 填写 PR 描述：
     - 做了什么更改
     - 为什么需要这个更改
     - 如何测试

## 代码规范

### JavaScript

- 使用 ES6+ 语法
- 使用 2 空格缩进
- 变量命名使用 camelCase
- 常量命名使用 UPPER_CASE
- 函数命名清晰表达意图

### CSS

- 使用 2 空格缩进
- 类名使用 kebab-case
- 遵循 BEM 命名规范（可选）

### HTML

- 使用语义化标签
- 属性使用双引号
- 自闭合标签加斜杠（可选）

## 项目结构

```
homepage/
├── public/              # 前端文件
│   ├── index.html      # HTML 结构
│   ├── styles.css      # 样式文件
│   ├── app.js          # 主要逻辑
│   └── data.js         # 默认数据
├── server.js           # 后端服务
├── package.json        # 依赖管理
└── README.md           # 项目文档
```

## 开发流程

1. **安装依赖**
   ```bash
   npm install
   ```

2. **启动开发服务器**
   ```bash
   npm start
   ```

3. **访问应用**
   ```
   http://localhost:3000
   ```

4. **修改代码**
   - 前端代码修改后刷新浏览器即可
   - 后端代码修改后需要重启服务器

## 测试

目前项目还没有自动化测试，请手动测试：

- [ ] 添加项目功能
- [ ] 编辑项目功能
- [ ] 删除项目功能
- [ ] 搜索功能
- [ ] 标签筛选功能
- [ ] GitHub 同步功能
- [ ] 导入导出功能
- [ ] 移动端显示

## 文档更新

如果你的更改影响了用户使用方式，请同时更新 README.md。

## 代码审查

所有 Pull Request 都会经过审查，可能会有以下反馈：

- 代码风格建议
- 功能实现建议
- 性能优化建议
- 安全性问题

请耐心等待审查，并根据反馈进行调整。

## 行为准则

- 尊重所有贡献者
- 接受建设性批评
- 关注项目最佳利益
- 展现同理心

## 问题？

如有任何问题，欢迎：

- 创建 Issue
- 在 Pull Request 中提问
- 联系维护者

再次感谢你的贡献！ 🎉
