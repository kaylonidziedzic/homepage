/**
 * 工具函数模块
 */
const Utils = {
  /**
   * XSS 防护：HTML 转义
   */
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * 验证 URL 格式
   */
  isValidUrl(str) {
    try {
      const url = new URL(str);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  },

  /**
   * 从 URL 提取域名
   */
  getDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  },

  /**
   * 格式化日期
   */
  formatDate(date, locale = 'zh-CN') {
    const opts = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return date.toLocaleDateString(locale, opts);
  },

  /**
   * 格式化时间
   */
  formatTime(date) {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * 解析逗号分隔的字符串为数组
   */
  parseCommaSeparated(str) {
    if (!str) return [];
    return str.split(/[,，]/).map(t => t.trim()).filter(Boolean);
  },

  /**
   * 生成唯一 ID
   */
  generateId(prefix = 'item') {
    return `${prefix}-${Date.now()}`;
  },

  /**
   * 根据名称首字母获取渐变背景色
   */
  getGradientByName(name) {
    const gradients = [
      "linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)",
      "linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)",
      "linear-gradient(120deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)",
      "linear-gradient(120deg, #fccb90 0%, #d57eeb 100%)",
      "linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)",
    ];
    const idx = (name?.charCodeAt(0) || 0) % gradients.length;
    return gradients[idx];
  },

  /**
   * 下载 JSON 文件
   */
  downloadJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  },

  /**
   * 读取文件内容
   */
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
};

// 导出
if (typeof window !== 'undefined') {
  window.Utils = Utils;
}
