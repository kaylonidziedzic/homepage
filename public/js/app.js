/**
 * 应用主入口
 * 依赖模块: state.js, api.js, utils.js, theme.js, render.js, github.js
 */

// --- 模态框管理 ---
const Modal = {
  /**
   * 打开编辑模态框
   */
  openEdit(id) {
    if (!AppState.unlocked) return;

    AppState.editingId = id;
    const { el } = AppState;

    el.modal.hidden = false;
    el.modal.removeAttribute('hidden');

    if (id) {
      const proj = AppState.findProject(id);
      if (proj) {
        el.form.name.value = proj.name;
        el.form.url.value = proj.url;
        el.form.icon.value = proj.icon || "";
        el.form.desc.value = proj.description || "";
        el.form.status.value = proj.status || "";
        el.form.tech.value = proj.tech?.join(", ") || "";
        el.form.tags.value = proj.tags?.join(", ") || "";
      }
      el.btnDelete.hidden = false;
    } else {
      el.form.reset();
      el.btnDelete.hidden = true;
    }
  },

  /**
   * 关闭编辑模态框
   */
  closeEdit() {
    const { el } = AppState;
    el.modal.hidden = true;
    el.modal.setAttribute('hidden', '');
    AppState.editingId = null;
  }
};

// 全局函数（HTML 调用）
window.openEdit = (id) => Modal.openEdit(id);
window.closeModal = () => Modal.closeEdit();

// --- 事件绑定 ---
function bindEvents() {
  const { el } = AppState;

  // 搜索
  el.search.addEventListener("input", (e) => {
    AppState.setSearch(e.target.value);
    Render.main();
  });

  // 卡片点击（事件委托）
  el.mainContent.addEventListener("click", (e) => {
    // 编辑按钮
    const editBtn = e.target.closest('.card-edit');
    if (editBtn) {
      e.stopPropagation();
      Modal.openEdit(editBtn.dataset.editId);
      return;
    }

    // 卡片跳转
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

  // 新增按钮
  el.btnAdd.addEventListener("click", () => {
    if (!AppState.unlocked) {
      return alert("请先点击左下角的 🔒 解锁编辑");
    }
    Modal.openEdit(null);
  });

  // 解锁按钮
  el.btnUnlock.addEventListener("click", async () => {
    const pwd = prompt("请输入密码解锁:");
    if (!pwd) return;

    const result = await Api.verifyPassword(pwd);
    if (result.success) {
      AppState.setUnlocked(true);
      Render.main();
      alert("✅ 解锁成功");
    } else {
      alert("❌ " + result.error);
    }
  });

  // 导出按钮
  el.btnExport.addEventListener("click", () => {
    Utils.downloadJson(
      { profile: AppState.profile, projects: AppState.projects },
      "nav_backup.json"
    );
  });

  // 导入按钮
  el.fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const content = await Utils.readFile(file);
      const data = JSON.parse(content);

      AppState.profile = data.profile || AppState.profile;
      AppState.projects = data.projects || data.services || [];

      Render.profile();
      await Api.saveData();
      Render.main();
      alert("导入成功并已同步！");
    } catch (err) {
      alert("文件格式错误");
    }
  });

  // 表单提交
  el.form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const f = new FormData(el.form);
    const item = {
      id: AppState.editingId || Utils.generateId('proj'),
      name: f.get("name"),
      url: f.get("url"),
      icon: f.get("icon"),
      description: f.get("desc"),
      status: f.get("status"),
      tech: Utils.parseCommaSeparated(f.get("tech")),
      tags: Utils.parseCommaSeparated(f.get("tags")),
      source: 'manual'
    };

    if (AppState.editingId) {
      AppState.updateProject(AppState.editingId, item);
    } else {
      AppState.addProject(item);
    }

    await Api.saveData();
    Modal.closeEdit();
    Render.main();
  });

  // 删除按钮
  el.btnDelete.addEventListener("click", async () => {
    if (confirm("确定删除吗？")) {
      AppState.deleteProject(AppState.editingId);
      await Api.saveData();
      Modal.closeEdit();
      Render.main();
    }
  });

  // 模态框背景点击关闭
  el.modal.addEventListener("click", (e) => {
    if (e.target === el.modal) Modal.closeEdit();
  });

  // GitHub 按钮
  el.btnGithub.addEventListener("click", () => Github.openModal());

  el.githubForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await Github.saveConfig();
  });

  document.getElementById("btnTestGithub").addEventListener("click", async () => {
    await Github.testConnection();
  });

  el.githubModal.addEventListener("click", (e) => {
    if (e.target === el.githubModal) Github.closeModal();
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
