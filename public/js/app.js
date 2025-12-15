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

// --- 事件绑定 ---
function bindEvents() {
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
