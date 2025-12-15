const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'config.json');

// GitHub API 缓存
const githubCache = {
  data: null,
  timestamp: 0,
  TTL: 5 * 60 * 1000 // 5分钟缓存
};

// 1. 初始化环境
// 确保能够解析 JSON body
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // 静态文件放 public 目录

// 2. 辅助函数：读取配置
function readConfig() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading config:", err);
  }
  return {};
}

// 3. API: 获取数据
app.get('/api/data', (req, res) => {
  const data = readConfig();
  res.json(data);
});

// 4. API: 保存数据 (只读模式，返回错误)
app.post('/api/data', (req, res) => {
  // 在 Vercel 等 Serverless 环境下，文件系统是只读的 (或临时的)
  // 因此我们不允许在线修改，而是要求用户修改代码仓库中的 data/config.json
  res.status(403).json({
    success: false,
    error: '当前部署模式为只读，请直接修改 GitHub 仓库中的 data/config.json 文件来更新内容。'
  });
});

// 5. API: 验证密码 (前端不再需要验证密码来解锁编辑功能，因为不能编辑)
app.post('/api/auth/verify', (req, res) => {
  // 总是返回失败，或者说明不需要密码
  res.status(403).json({ success: false, error: '只读模式无需登录' });
});

// 6. API: GitHub 仓库列表（代理 GitHub API，带缓存）
app.get('/api/github/repos', async (req, res) => {
  const { username, refresh } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    // 检查缓存是否有效（同一用户名且未过期）
    const now = Date.now();
    if (!refresh &&
      githubCache.data &&
      githubCache.username === username &&
      (now - githubCache.timestamp) < githubCache.TTL) {
      console.log('Returning cached GitHub data');
      return res.json(githubCache.data);
    }

    // 从配置文件获取 Token
    const config = readConfig();
    const token = config.githubConfig?.token;

    const headers = {
      'User-Agent': 'Personal-Homepage-App',
      'Accept': 'application/vnd.github.v3+json'
    };

    // 从服务端配置读取 token
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos = await response.json();

    // 提取需要的字段
    const simplifiedRepos = repos.map(repo => ({
      id: `github-${repo.id}`,
      name: repo.name,
      description: repo.description || '暂无描述',
      url: repo.html_url,
      homepage: repo.homepage,
      stars: repo.stargazers_count,
      language: repo.language,
      topics: repo.topics || [],
      lastUpdate: repo.updated_at,
      isPrivate: repo.private,
      isFork: repo.fork
    }));

    // 更新缓存
    githubCache.data = simplifiedRepos;
    githubCache.username = username;
    githubCache.timestamp = Date.now();
    console.log('GitHub data cached');

    res.json(simplifiedRepos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  // 7. API: 检查网站状态
  app.get('/api/check-status', async (req, res) => {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL required' });
    }

    try {
      // 设置 3秒超时，避免请求堆积
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(url, {
        method: "HEAD", // 只请求头，减少流量
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; StatusBot/1.0)"
        }
      });

      clearTimeout(timeout);
      // 只要有响应（即使 404/403/500）都算服务器在线
      res.json({ online: true, status: response.status });
    } catch (error) {
      res.json({ online: false, error: error.message });
    }
  });

  // 8. 启动服务
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });

