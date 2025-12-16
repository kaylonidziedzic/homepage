/**
 * 应用主入口
 * 依赖模块: state.js, api.js, utils.js, theme.js, render.js, github.js
 */

// --- 模态框管理 (已移除，只读模式) ---
const Modal = {
  openEdit() { },
  closeEdit() { }
};

// 全局函数（HTML 调用）- 保持为空以防报错
window.openEdit = () => { };
window.closeModal = () => { };

// --- 状态检测管理 ---
const StatusManager = {
  /**
   * 检查所有可见卡片的状态（全部并发，不等待）
   */
  checkVisible() {
    const badges = document.querySelectorAll('.card-status.status-checking');
    if (badges.length === 0) return;

    // 每个卡片独立检测，不阻塞其他卡片
    badges.forEach(badge => {
      const card = badge.closest('.card');
      const url = card.dataset.url;
      this.checkOne(badge, url); // 不 await，让它们并行执行
    });
  },

  /**
   * 检测单个项目
   */
  async checkOne(badge, url) {
    if (!url || url === '#' || !url.startsWith('http')) {
      badge.classList.remove('status-checking');
      badge.style.display = 'none';
      return;
    }

    try {
      const res = await fetch(`/api/check-status?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      badge.classList.remove('status-checking');

      if (data.online) {
        badge.textContent = "在线";
        badge.classList.add('status-online');
      } else {
        badge.textContent = "离线";
        badge.classList.add('status-offline');
        badge.title = data.error || "请求超时";
      }
    } catch (err) {
      badge.classList.remove('status-checking');
      badge.textContent = "检测失败";
      badge.classList.add('status-offline');
    }
  }
};

// --- 事件绑定 ---
function bindEvents() {
  const { el } = AppState;

  // 1. 劫持 Render.main 以触发自动检测
  const originalRenderMain = Render.main;
  Render.main = function () {
    // 调用原始渲染
    if (originalRenderMain) {
      originalRenderMain.call(Render);
    }
    // 延时检测
    setTimeout(() => StatusManager.checkVisible(), 100);
  };

  // 2. 搜索
  el.search.addEventListener("input", (e) => {
    const val = e.target.value.trim();

    // 检查暗号
    if (val === AppState.secretCode) {
      AppState.secretMode = !AppState.secretMode; // 切换状态
      e.target.value = ""; // 清空输入框
      AppState.setSearch("");
      alert(AppState.secretMode ? "🔓 隐私模式已解锁" : "🔒 隐私模式已关闭");
      Render.main();
      return;
    }

    AppState.setSearch(val);
    Render.main();
  });

  // 3. 卡片点击（事件委托）
  el.mainContent.addEventListener("click", (e) => {
    // 移除编辑逻辑，只保留跳转
    const card = e.target.closest('.card');
    if (card?.dataset.url) {
      window.open(card.dataset.url, '_blank');
    }
  });

  // 4. 标签点击（事件委托）
  el.tagChips.addEventListener("click", (e) => {
    const chip = e.target.closest('.chip');
    if (chip) {
      AppState.setTag(chip.dataset.tag || '');
      Render.main();
    }
  });

  // 5. 主题切换
  el.btnTheme.addEventListener("click", () => Theme.toggle());
}

// --- 初始化 ---
document.addEventListener("DOMContentLoaded", async () => {
  // 初始化 DOM 引用
  AppState.initElements();

  // 初始化主题
  Theme.init();

  // 加载数据
  const apiData = await Api.loadData();

  // 修复：明确检查是否为空对象
  const hasApiData = apiData && Object.keys(apiData).length > 0;

  // 如果 API 返回了数据，就用 API 的；否则用默认的
  const data = hasApiData ? apiData : (window.defaultData || {});
  AppState.loadData(data);

  // 启动时钟
  Render.startClock();

  // 绑定事件 (先绑定事件，这里面会修改 Render.main)
  bindEvents();

  // 渲染页面
  Render.profile();
  Render.main();

  // 自动同步 GitHub
  if (AppState.githubConfig.enabled && AppState.githubConfig.username) {
    await Github.sync();
  }
});
