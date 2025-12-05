const STORAGE_KEYS = {
  favorites: "nav-favorites",
  data: "nav-data",
  password: "nav-password",
};

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

// 元素映射 (ID 保持不变以便兼容)
const elements = {
  cards: document.getElementById("cards"),
  search: document.getElementById("searchInput"),
  clearSearch: document.getElementById("clearSearch"),
  tagFilter: document.getElementById("tagFilter"), // 隐藏的 select，用于数据
  tagChips: document.getElementById("tagChips"),
  favoriteFilter: document.getElementById("favoriteFilter"),
  
  unlockButton: document.getElementById("unlockButton"),
  exportButton: document.getElementById("exportButton"),
  importInput: document.getElementById("importInput"),
  
  addFormSection: document.getElementById("addForm"),
  form: document.getElementById("serviceForm"),
  resetForm: document.getElementById("resetForm"),
  submitBtn: document.getElementById("submitBtn"),
  cancelEdit: document.getElementById("cancelEdit"),
  
  formTitle: document.getElementById("formTitle"),
  formSubtitle: document.getElementById("formSubtitle"),
  toast: document.getElementById("toast"),
  statFilters: document.getElementById("statFilters"),
  
  clock: document.getElementById("clock"),
  date: document.getElementById("date"),
};

document.addEventListener("DOMContentLoaded", () => {
  const saved = loadData();
  services = saved?.services?.length ? saved.services : window.defaultServices;
  servers = saved?.servers?.length ? saved.servers : window.defaultServers;
  
  startClock();
  renderFilters();
  render();
  bindEvents();
});

// 新增：时钟逻辑
function startClock() {
  const update = () => {
    const now = new Date();
    elements.clock.textContent = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elements.date.textContent = now.toLocaleDateString('zh-CN', options);
  };
  update();
  setInterval(update, 1000);
}

function bindEvents() {
  elements.search.addEventListener("input", (e) => {
    state.search = e.target.value.trim().toLowerCase();
    elements.clearSearch.hidden = !state.search;
    render();
  });

  elements.clearSearch.addEventListener("click", () => {
    elements.search.value = "";
    state.search = "";
    elements.clearSearch.hidden = true;
    render();
  });

  // 这里的 tagFilter 是为了兼容旧代码逻辑，实际上我们主要用 Chips
  elements.tagFilter.addEventListener("change", (e) => {
    state.tag = e.target.value;
    render();
  });

  elements.favoriteFilter.addEventListener("change", (e) => {
    state.favoritesOnly = e.target.checked;
    render();
  });

  elements.unlockButton.addEventListener("click", handleUnlock);
  elements.exportButton.addEventListener("click", handleExport);
  elements.importInput.addEventListener("change", handleImport);
  
  // 模态框逻辑
  elements.resetForm.addEventListener("click", resetEditing);
  elements.cancelEdit.addEventListener("click", () => {
    resetEditing();
    elements.addFormSection.hidden = true; // 关闭模态框
  });

  elements.form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!unlocked) return showToast("请先解锁编辑。", true);
    const data = new FormData(elements.form);
    const tags = (data.get("tags") || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      name: data.get("name").trim(),
      description: data.get("description").trim(),
      purpose: data.get("purpose").trim(),
      server: data.get("server").trim(),
      url: data.get("url").trim(),
      port: data.get("port") ? Number(data.get("port")) : undefined,
      auth: data.get("auth").trim(),
      tags,
    };

    if (editingId) {
      services = services.map((svc) =>
        svc.id === editingId ? { ...svc, ...payload } : svc
      );
      showToast("已保存修改");
    } else {
      services = [{ id: `svc-${Date.now()}`, ...payload }, ...services];
      showToast("已新增服务");
    }

    if (!servers.find((s) => s.name === payload.server)) {
      servers = [...servers, { name: payload.server, note: "" }];
    }
    persist();
    renderFilters();
    render();
    
    // 提交后重置并关闭模态框
    resetEditing();
    elements.addFormSection.hidden = true; 
  });
}

function renderFilters() {
  const tags = new Set();
  services.forEach((svc) => svc.tags?.forEach((t) => tags.add(t)));
  const tagOptions = ["", ...tags];
  // 保持 select 更新以免逻辑断裂
  elements.tagFilter.innerHTML = tagOptions.map(t => `<option value="${t}">${t}</option>`).join("");
  renderChips(tagOptions.filter(Boolean));
}

function renderChips(tagList) {
  // 添加“全部”选项
  const allBtn = `<button class="chip ${state.tag === "" ? "active" : ""}" data-tag="">全部</button>`;
  const others = tagList.map(
      (tag) => `<button class="chip ${state.tag === tag ? "active" : ""}" data-tag="${tag}">${tag}</button>`
    ).join("");
    
  elements.tagChips.innerHTML = allBtn + others;
  
  elements.tagChips.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.tag = chip.dataset.tag;
      renderFilters(); // 重新渲染为了高亮状态
      render();
    });
  });
}

function render() {
  const filtered = services.filter((svc) => {
    const matchesSearch = [svc.name, svc.description, svc.server, svc.tags?.join(" ")]
      .filter(Boolean)
      .some((text) => text.toLowerCase().includes(state.search));

    const matchesTag = !state.tag || svc.tags?.includes(state.tag);
    const matchesFavorite = !state.favoritesOnly || state.favorites.has(svc.id);
    return matchesSearch && matchesTag && matchesFavorite;
  });

  elements.cards.innerHTML = filtered.map((svc) => renderCard(svc)).join("");
  
  if (filtered.length === 0) {
    elements.cards.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:rgba(255,255,255,0.4); padding:40px;">没有找到相关服务</div>`;
  }

  bindCardActions();
  updateStats(filtered.length);
}

// 修改：新的卡片渲染逻辑 (类似 Duckfolio)
function renderCard(svc) {
  const favorite = state.favorites.has(svc.id);
  // 获取 Favicon，使用 Google API
  const domain = svc.url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const iconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;

  return `
    <article class="card" data-id="${svc.id}" onclick="window.open('${svc.url}', '_blank')">
      <div class="card-actions" onclick="event.stopPropagation()">
         <button class="mini-btn edit" title="编辑">✎</button>
      </div>
      <div class="card-top">
        <img src="${iconUrl}" class="card-icon" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PHBhdGggZD0iTTEyIDhhNCA0IDAgMSAwIDAgOCA0IDQgMCAwIDAgMC04eiIvPjwvc3ZnPg=='" alt="icon" />
        <button class="fav-btn ${favorite ? "active" : ""}" onclick="event.stopPropagation(); toggleFavorite('${svc.id}')">
          ${favorite ? "★" : "☆"}
        </button>
      </div>
      <div class="card-info">
        <div class="card-title" title="${svc.name}">${svc.name}</div>
        <div class="card-desc">${svc.description || svc.server || "无描述"}</div>
      </div>
    </article>
  `;
}

// 必须暴露给全局因为 onclick 用了字符串调用
window.toggleFavorite = function(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(Array.from(state.favorites)));
  render();
};

function bindCardActions() {
  document.querySelectorAll(".edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.closest(".card").dataset.id;
      startEdit(id);
    });
  });
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.favorites);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch (e) { return new Set(); }
}

function persist() {
  const payload = { services, servers };
  localStorage.setItem(STORAGE_KEYS.data, JSON.stringify(payload));
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.data);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

async function handleUnlock() {
  const existing = localStorage.getItem(STORAGE_KEYS.password);
  if (!existing) {
    const pwd = prompt("首次设置编辑密码：");
    if (!pwd) return;
    const hash = await sha256(pwd);
    localStorage.setItem(STORAGE_KEYS.password, hash);
    unlocked = true;
    afterUnlock();
    showToast("已解锁");
    return;
  }
  const pwd = prompt("请输入编辑密码");
  if (!pwd) return;
  const hash = await sha256(pwd);
  if (hash === existing) {
    unlocked = true;
    afterUnlock();
    showToast("已解锁");
  } else {
    showToast("密码错误", true);
  }
}

function afterUnlock() {
  elements.unlockButton.textContent = "🔓";
  elements.exportButton.disabled = false;
  elements.importInput.disabled = false;
  
  // 解锁后默认不弹出表单，而是允许点击卡片上的编辑按钮
  // 也可以点击底部“+”号（如果以后加的话），目前逻辑是允许操作了
}

function handleExport() {
  const payload = { services, servers, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "services.json";
  a.click();
  URL.revokeObjectURL(url);
  showToast("已导出 JSON");
}

function handleImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!unlocked) {
    showToast("请先解锁编辑", true);
    event.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed.services)) throw new Error("格式错误");
      services = parsed.services;
      servers = parsed.servers || [];
      persist();
      renderFilters();
      render();
      showToast("导入成功");
    } catch (e) {
      showToast("导入失败", true);
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function startEdit(id) {
  if (!unlocked) return showToast("请先解锁编辑", true);
  const svc = services.find((s) => s.id === id);
  if (!svc) return;
  editingId = id;
  elements.formTitle.textContent = "编辑服务";
  elements.formSubtitle.textContent = svc.name;
  elements.submitBtn.textContent = "保存";
  
  // 填充表单
  elements.form.name.value = svc.name || "";
  elements.form.description.value = svc.description || "";
  elements.form.purpose.value = svc.purpose || "";
  elements.form.server.value = svc.server || "";
  elements.form.url.value = svc.url || "";
  elements.form.port.value = svc.port ?? "";
  elements.form.auth.value = svc.auth || "";
  elements.form.tags.value = (svc.tags || []).join(", ");
  
  // 显示模态框
  elements.addFormSection.hidden = false;
}

function resetEditing() {
  editingId = null;
  elements.form.reset();
  elements.formTitle.textContent = "新增服务";
  elements.formSubtitle.textContent = "配置新的服务项";
  elements.submitBtn.textContent = "添加";
}

function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.style.background = isError ? "rgba(220, 38, 38, 0.9)" : "rgba(0, 0, 0, 0.8)";
  elements.toast.classList.add("show");
  setTimeout(() => elements.toast.classList.remove("show"), 2000);
}

function updateStats(count) {
  elements.statFilters.textContent = count > 0 ? `Showing ${count} services` : "";
}

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
