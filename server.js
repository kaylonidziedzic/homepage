const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

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

// 5. 启动服务
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
