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
  queue: [],
  processing: false,
  concurrency: 3, // 同时检测3个

  /**
   * 检查所有可见卡片的状态
   */
  checkVisible() {
    // 找到所有待检测的圆点
    const dots = document.querySelectorAll('.ping-dot.pending');
    if (dots.length === 0) return;

    // 清空旧队列
    this.queue = [];

    dots.forEach(dot => {
      const card = dot.closest('.card');
      const url = card.dataset.url;
      this.queue.push({ dot, url });
    });

    this.processQueue();
  },

  /**
   * 处理队列
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    // 并发处理
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.concurrency);
      await Promise.all(batch.map(item => this.checkOne(item)));
    }

    this.processing = false;
  },

  /**
   * 检测单个项目
   */
  async checkOne({ dot, url }) {
    if (!url || url === '#' || !url.startsWith('http')) {
      dot.remove();
      return;
    }

    try {
      const res = await fetch(`/api/check-status?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      dot.classList.remove('pending');
      if (data.online) {
        dot.classList.add('online');
        dot.title = `在线 (HTTP ${data.status})`;
      } else {
        dot.classList.add('offline');
        dot.title = `无法访问: ${data.error || '未知错误'}`;
      }
    } catch (err) {
      dot.classList.remove('pending');
      dot.classList.add('offline');
      dot.title = "检测失败";
    }
  }
};

// --- 事件绑定 ---
function bindEvents() {
  const { el } = AppState;

  // 监听渲染完成事件（通过劫持 Render.main ? 或者简单点，在 Render.main 后手动调用）
  // 这里我们采用 simpler approach: 每次 render 后调用
  const originalRenderMain = Render.main;
  Render.main = function () {
    originalRenderMain.call(Render);
    setTimeout(() => StatusManager.checkVisible(), 100); // 延时一点等待 DOM 更新
  };
  {
    const { el } = AppState;

    // 搜索
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

    // 卡片点击（事件委托）
    el.mainContent.addEventListener("click", (e) => {
      // 移除编辑逻辑，只保留跳转
      const card = e.target.closest('.card');
      if (card?.dataset.url) {
        window.open(card.dataset.url, '_blank');
      }
    });

    // 标签点击（事件委托）
    el.tagChips.addEventListener("click", (e) => {
      const chip = e.target.closest('.chip');
      if (chip) {
        AppState.setTag(chip.dataset.tag || '');
        Render.main();
      }
    });

    // 主题切换
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

    // 渲染页面
    Render.profile();
    Render.main();

    // 绑定事件
    bindEvents();

    // 自动同步 GitHub
    if (AppState.githubConfig.enabled && AppState.githubConfig.username) {
      await Github.sync();
    }
  });
