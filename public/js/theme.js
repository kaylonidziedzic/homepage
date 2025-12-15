/**
 * 主题管理模块
 */
const Theme = {
  STORAGE_KEY: 'nav-theme',

  /**
   * 初始化主题
   */
  init() {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');

    this.apply(theme);
  },

  /**
   * 获取当前主题
   */
  current() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  },

  /**
   * 应用主题
   */
  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.updateButton(theme);
  },

  /**
   * 切换主题
   */
  toggle() {
    const newTheme = this.current() === 'dark' ? 'light' : 'dark';
    this.apply(newTheme);
  },

  /**
   * 更新主题按钮显示
   */
  updateButton(theme) {
    const btn = AppState.el?.btnTheme;
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
      btn.title = theme === 'dark' ? '切换到亮色模式' : '切换到深色模式';
    }
  }
};

// 导出
if (typeof window !== 'undefined') {
  window.Theme = Theme;
}
