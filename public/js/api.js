/**
 * API 通信模块
 */
const Api = {
  /**
   * 从后端获取数据
   */
  async loadData() {
    try {
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error("API连接失败");
      return await res.json();
    } catch (e) {
      console.warn("无法连接后端，使用本地缓存:", e);
      try {
        return JSON.parse(localStorage.getItem(AppState.STORAGE_KEYS.data));
      } catch {
        return null;
      }
    }
  },

  /**
   * 保存数据到后端
   */
  async saveData(showAlert = true) {
    try {
      const payload = AppState.getDataSnapshot();
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("服务器返回错误");

      // 本地备份
      localStorage.setItem(AppState.STORAGE_KEYS.data, JSON.stringify(payload));

      if (showAlert) {
        alert("✅ 已同步到服务器");
      }
      return true;
    } catch (e) {
      alert("❌ 保存失败: " + e.message);
      return false;
    }
  },

  /**
   * 验证密码
   */
  async verifyPassword(password) {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        return { success: true };
      } else {
        const data = await res.json();
        return { success: false, error: data.error || "密码错误" };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * 获取 GitHub 仓库列表
   */
  async fetchGithubRepos(username) {
    const url = `/api/github/repos?username=${encodeURIComponent(username)}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`GitHub API 请求失败: ${res.status}`);
    }

    return await res.json();
  }
};

// 导出
if (typeof window !== 'undefined') {
  window.Api = Api;
}
