const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'nav.db');

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

// 5. API: GitHub 仓库列表（代理 GitHub API）
app.get('/api/github/repos', async (req, res) => {
  const { username, token } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const headers = {
      'User-Agent': 'Personal-Homepage-App',
      'Accept': 'application/vnd.github.v3+json'
    };

    // 如果提供了 token，添加认证头（提高 API 限额）
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

    res.json(simplifiedRepos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. 启动服务
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
