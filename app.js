const STORAGE_KEYS = {
  favorites: "nav-favorites",
  data: "nav-data",
  password: "nav-password",
};

// 状态管理
let services = [];
let servers = [];
let unlocked = false;
let editingId = null;

const state = {
  search: "",
  tag: "",
  favoritesOnly: false,
  favorites: loadFavorites(),
};

// DOM 元素引用
const el = {
  clock: document.getElementById("clock"),
  date: document.getElementById("date"),
  search: document.getElementById("searchInput"),
  clearSearch: document.getElementById("clearSearch"),
  tagChips: document.getElementById("tagChips"),
  favFilter: document.getElementById("favoriteFilter"),
  
  cards: document.getElementById("cards"),
  statFilters: document.getElementById("statFilters"),
  
  // Dock 按钮
  btnUnlock: document.getElementById("unlockButton"),
  btnExport: document.getElementById("exportButton"),
  btnImport: document.getElementById("importInput"),
  btnAdd: document.getElementById("addServiceBtn"), // 新增按钮
  
  // 模态框相关
  modal: document.getElementById("modalOverlay"),
  form: document.getElementById("serviceForm"),
  formTitle: document.getElementById("formTitle"),
  btnCancelEdit: document.getElementById("cancelEdit"),
  btnDelete: document.getElementById("deleteBtn"),
  
  toast: document.getElementById("toast"),
};

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  const saved = loadData();
  // 兼容 data.js 中的初始数据
  services = saved?.services?.length ? saved.services : (window.defaultServices || []);
  servers = saved?.servers?.length ? saved.servers : (window.defaultServers || []);

  startClock();
  renderFilters();
  render();
  bindEvents();
  checkUnlockState(); // 检查是否有已保存的密码（可选，为了安全通常默认锁定）
});

// --- 时钟逻辑 ---
function startClock() {
  const update = () => {
    const now = new Date();
    el.clock.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const opts = { weekday: 'long', month: 'short', day: 'numeric' };
    el.date.textContent = now.toLocaleDateString('zh-CN', opts).replace('日', '日 ');
  };
  update();
  setInterval(update, 1000);
}

// --- 核心渲染 ---
function render() {
  const filtered = services.filter((svc) => {
    const textMatch = [svc.name, svc.description, svc.server, svc.url, svc.tags?.join(" ")]
      .filter(Boolean)
      .some((t) => t.toLowerCase().includes(state.search));
    const tagMatch = !state.tag || svc.tags?.includes(state.tag);
    const favMatch = !state.favoritesOnly || state.favorites.has(svc.id);
    return textMatch && tagMatch && favMatch;
  });

  el.cards.innerHTML = filtered.map(svc => renderCard(svc)).join("");
  
  // 空状态提示
  if (filtered.length === 0) {
    el.cards.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#64748b;padding:40px;">无匹配服务</div>`;
  }

  updateStats(filtered.length);
}

function renderCard(svc) {
  const isFav = state.favorites.has(svc.id);
  // 尝试从 URL 获取主域名用于获取图标
  let domain = "";
  try { domain = new URL(svc.url).hostname; } catch(e) { domain = "localhost"; }
  const iconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
  
  // 编辑按钮只有在解锁状态下才显示 (通过 class 控制)
  const editBtnClass = unlocked ? "card-edit-btn visible" : "card-edit-btn";

  return `
    <article class="card" onclick="handleCardClick('${svc.url}')">
      <button class="${editBtnClass}" onclick="event.stopPropagation(); openEdit('${svc.id}')" title="编辑">✎</button>
      
      <div class="card-top">
        <img src="${iconUrl}" class="service-icon" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuNSkiIHN0cm9rZS13aWR0aD0iMiI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48L3N2Zz4='">
        <div class="fav-icon ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite('${svc.id}')">★</div>
      </div>
      
      <div class="card-content">
        <div class="card-name" title="${svc.name}">${svc.name}</div>
        <div class="card-meta">${svc.description || svc.server}</div>
      </div>
    </article>
  `;
}

// --- 事件绑定 ---
function bindEvents() {
  // 搜索
  el.search.addEventListener("input", (e) => {
    state.search = e.target.value.trim().toLowerCase();
    el.clearSearch.hidden = !state.search;
    render();
  });
  el.clearSearch.addEventListener("click", () => {
    el.search.value = ""; state.search = ""; el.clearSearch.hidden = true; render();
  });

  // 收藏筛选
  el.favFilter.addEventListener("change", (e) => {
    state.favoritesOnly = e.target.checked;
    render();
  });

  // Dock 按钮
  el.btnUnlock.addEventListener("click", handleUnlock);
  el.btnExport.addEventListener("click", handleExport);
  el.btnImport.addEventListener("change", handleImport);
  el.btnAdd.addEventListener("click", () => openEdit(null)); // 新增模式

  // 模态框
  el.btnCancelEdit.addEventListener("click", closeModal);
  el.modal.addEventListener("click", (e) => { if (e.target === el.modal) closeModal(); });
  
  // 表单提交
  el.form.addEventListener("submit", handleFormSubmit);
  
  // 删除
  el.btnDelete.addEventListener("click", handleDelete);
}

// --- 逻辑控制 ---

function handleCardClick(url) {
  window.open(url, '_blank');
}

window.toggleFavorite = function(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(Array.from(state.favorites)));
  render();
};

window.openEdit = function(id) {
  if (!unlocked) return showToast("请先解锁编辑权限 🔒", true);
  
  editingId = id;
  el.modal.hidden = false;
  el.btnDelete.hidden = !id; // 只有编辑现有项时才显示删除
  
  if (id) {
    const svc = services.find(s => s.id === id);
    if (!svc) return;
    el.formTitle.textContent = "编辑服务";
    // 填充表单
    el.form.name.value = svc.name;
    el.form.url.value = svc.url;
    el.form.server.value = svc.server;
    el.form.port.value = svc.port || "";
    el.form.description.value = svc.description || "";
    el.form.purpose.value = svc.purpose || "";
    el.form.tags.value = (svc.tags || []).join(", ");
    el.form.auth.value = svc.auth || "";
  } else {
    el.formTitle.textContent = "新增服务";
    el.form.reset();
  }
};

function closeModal() {
  el.modal.hidden = true;
  el.form.reset();
  editingId = null;
}

function handleFormSubmit(e) {
  e.preventDefault();
  const formData = new FormData(el.form);
  const tags = (formData.get("tags") || "").split(",").map(t=>t.trim()).filter(Boolean);
  
  const payload = {
    name: formData.get("name"),
    url: formData.get("url"),
    server: formData.get("server"),
    port: formData.get("port") ? Number(formData.get("port")) : undefined,
    description: formData.get("description"),
    purpose: formData.get("purpose"),
    auth: formData.get("auth"),
    tags
  };

  if (editingId) {
    services = services.map(s => s.id === editingId ? { ...s, ...payload, id: editingId } : s);
    showToast("已更新");
  } else {
    services.unshift({ id: `svc-${Date.now()}`, ...payload });
    showToast("已添加");
  }
  
  persist();
  renderFilters();
  render();
  closeModal();
}

function handleDelete() {
  if (!editingId || !confirm("确定要删除这个服务吗？")) return;
  services = services.filter(s => s.id !== editingId);
  persist();
  renderFilters();
  render();
  closeModal();
  showToast("已删除");
}

// --- 辅助功能 ---

function renderFilters() {
  // 收集所有 Tag
  const tags = new Set();
  services.forEach(s => s.tags?.forEach(t => tags.add(t)));
  
  // 生成 Chips
  let html = `<button class="chip ${state.tag === "" ? "active" : ""}" onclick="setTag('')">全部</button>`;
  tags.forEach(tag => {
    const active = state.tag === tag ? "active" : "";
    html += `<button class="chip ${active}" onclick="setTag('${tag}')">${tag}</button>`;
  });
  el.tagChips.innerHTML = html;
}

window.setTag = function(tag) {
  state.tag = tag;
  renderFilters(); // 重新渲染以更新高亮
  render();
};

function updateStats(count) {
  const filterText = state.tag ? ` / ${state.tag}` : "";
  el.statFilters.textContent = `共 ${count} 个服务${filterText}`;
}

// --- 数据持久化与解锁 ---

async function handleUnlock() {
  const existing = localStorage.getItem(STORAGE_KEYS.password);
  
  if (unlocked) {
    // 重新锁定逻辑（可选）
    unlocked = false;
    afterLock();
    showToast("已锁定");
    return;
  }

  if (!existing) {
    const pwd = prompt("首次使用，请设置编辑密码：");
    if (!pwd) return;
    const hash = await sha256(pwd);
    localStorage.setItem(STORAGE_KEYS.password, hash);
    doUnlock();
    showToast("密码已设置并解锁");
  } else {
    const pwd = prompt("请输入编辑密码：");
    if (!pwd) return;
    const hash = await sha256(pwd);
    if (hash === existing) {
      doUnlock();
      showToast("解锁成功");
    } else {
      showToast("密码错误 🚫", true);
    }
  }
}

function doUnlock() {
  unlocked = true;
  el.btnUnlock.innerHTML = `<span class="emoji">🔓</span>`; // 改变图标
  el.btnExport.disabled = false;
  el.btnImport.disabled = false;
  el.btnImport.parentElement.style.opacity = "1";
  el.btnAdd.disabled = false;
  render(); // 重新渲染以显示编辑按钮
}

function afterLock() {
  el.btnUnlock.innerHTML = `<span class="emoji">🔒</span>`;
  el.btnExport.disabled = true;
  el.btnImport.disabled = true;
  el.btnImport.parentElement.style.opacity = "0.5";
  el.btnAdd.disabled = true;
  render();
}

function persist() {
  localStorage.setItem(STORAGE_KEYS.data, JSON.stringify({ services, servers }));
}

function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.data)); } 
  catch { return null; }
}

function loadFavorites() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites)) || []); }
  catch { return new Set(); }
}

function handleExport() {
  const blob = new Blob([JSON.stringify({ services, servers }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `nav-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
}

function handleImport(e) {
  if (!unlocked) return;
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (Array.isArray(data.services)) {
        services = data.services;
        servers = data.servers || [];
        persist();
        renderFilters();
        render();
        showToast("数据已导入");
      }
    } catch { showToast("文件格式错误", true); }
  };
  reader.readAsText(file);
  e.target.value = "";
}

function showToast(msg, err = false) {
  el.toast.textContent = msg;
  el.toast.style.color = err ? "#ef4444" : "#000";
  el.toast.classList.add("show");
  setTimeout(() => el.toast.classList.remove("show"), 2000);
}

async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
