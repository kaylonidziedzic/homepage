const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'nav.db');

// 密码配置 (可通过环境变量设置)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// GitHub API 缓存
const githubCache = {
  data: null,
  timestamp: 0,
  TTL: 5 * 60 * 1000 // 5分钟缓存
};

// 1. 初始化环境
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // 静态文件放 public 目录

// 2. 初始化 SQLite 数据库
const db = new sqlite3.Database(DB_PATH);
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT
  )`);
  // 插入默认空数据（如果不存在）
  db.run(`INSERT OR IGNORE INTO config (id, data) VALUES (1, '{}')`);
});

// 3. API: 获取数据
app.get('/api/data', (req, res) => {
  db.get("SELECT data FROM config WHERE id = 1", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(JSON.parse(row.data || '{}'));
  });
});

// 4. API: 保存数据
app.post('/api/data', (req, res) => {
  const jsonData = JSON.stringify(req.body);
  db.run("UPDATE config SET data = ? WHERE id = 1", [jsonData], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 5. API: 验证密码
app.post('/api/auth/verify', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, error: '密码不能为空' });
  }

  const inputBuffer = Buffer.from(password);
  const correctBuffer = Buffer.from(ADMIN_PASSWORD);

  // timingSafeEqual 要求两个 buffer 长度相同
  if (inputBuffer.length !== correctBuffer.length) {
    return res.status(401).json({ success: false, error: '密码错误' });
  }

  if (crypto.timingSafeEqual(inputBuffer, correctBuffer)) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: '密码错误' });
  }
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

    // 从数据库获取配置（包含 token）
    const config = await new Promise((resolve, reject) => {
      db.get("SELECT data FROM config WHERE id = 1", (err, row) => {
        if (err) reject(err);
        else resolve(JSON.parse(row?.data || '{}'));
      });
    });

    const token = config.githubConfig?.token;

    const headers = {
      'User-Agent': 'Personal-Homepage-App',
      'Accept': 'application/vnd.github.v3+json'
    };

    // 从服务端配置读取 token，而不是从前端传入
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
});

// 6. 启动服务
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
