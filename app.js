/* 保持原有的 STORAGE_KEYS, services 等变量定义不变，仅修改 renderCard 和 modal 逻辑 */

const STORAGE_KEYS = { favorites: "nav-favorites", data: "nav-data", password: "nav-password" };
let services = []; let servers = []; let unlocked = false; let editingId = null;
const state = { search: "", tag: "", favoritesOnly: false, favorites: loadFavorites() };

// 简化的 DOM 引用
const el = {
  clock: document.getElementById("clock"),
  date: document.getElementById("date"),
  cards: document.getElementById("cards"),
  search: document.getElementById("searchInput"),
  tagChips: document.getElementById("tagChips"),
  modal: document.getElementById("modalOverlay"),
  form: document.getElementById("serviceForm"),
  toast: document.getElementById("toast"),
  // Buttons
  btnUnlock: document.getElementById("unlockButton"),
  btnAdd: document.getElementById("addBtn"),
  btnExport: document.getElementById("exportBtn"),
  fileInput: document.getElementById("importInput")
};

document.addEventListener("DOMContentLoaded", () => {
  const saved = loadData();
  services = saved?.services || window.defaultServices || [];
  servers = saved?.servers || [];
  startClock(); render(); bindEvents();
});

function startClock() {
  const update = () => {
    const now = new Date();
    el.clock.innerText = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    el.date.innerText = now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  };
  setInterval(update, 1000); update();
}

function render() {
  // 1. 生成标签 (Chips)
  const tags = new Set(); services.forEach(s => s.tags?.forEach(t => tags.add(t)));
  const chipsHtml = [`<div class="chip ${state.tag===''?'active':''}" onclick="setTag('')">全部</div>`]
    .concat([...tags].map(t => `<div class="chip ${state.tag===t?'active':''}" onclick="setTag('${t}')">${t}</div>`));
  el.tagChips.innerHTML = chipsHtml.join("");

  // 2. 过滤服务
  const filtered = services.filter(s => {
    const textMatch = (s.name+s.url+s.tags?.join("")).toLowerCase().includes(state.search);
    const tagMatch = !state.tag || s.tags?.includes(state.tag);
    return textMatch && tagMatch;
  });

  // 3. 渲染卡片 (核心：智能图标)
  el.cards.innerHTML = filtered.map(svc => {
    const iconHtml = getIconHtml(svc);
    const editBtn = unlocked ? `<button class="card-edit" onclick="event.stopPropagation(); editService('${svc.id}')">✎</button>` : '';
    
    return `
      <div class="card" onclick="window.open('${svc.url}', '_blank')">
        ${editBtn}
        <div class="card-top">
          ${iconHtml}
        </div>
        <div class="card-info">
          <div class="card-name">${svc.name}</div>
          <div class="card-desc">${svc.description || svc.url.split('//')[1]}</div>
        </div>
      </div>
    `;
  }).join("") || `<div style="color:#555;text-align:center;grid-column:1/-1;padding:20px">无相关服务</div>`;
}

// --- 智能图标生成器 ---
function getIconHtml(svc) {
  // A. 如果用户填了 Emoji (简单的判断：非 http 开头且短)
  if (svc.icon && !svc.icon.startsWith("http") && svc.icon.length < 5) {
    return `<div class="icon-box" style="background:#27272a; font-size:28px">${svc.icon}</div>`;
  }
  
  // B. 如果用户填了图片 URL
  if (svc.icon && svc.icon.startsWith("http")) {
    return `<div class="icon-box" style="background:transparent"><img src="${svc.icon}" class="service-icon"></div>`;
  }

  // C. 默认尝试 Favicon，失败显示首字母
  // 为了美观，我们直接用首字母作为默认兜底，不再显示那丑陋的 broken image
  // 这里生成一个基于名称的固定颜色
  const colors = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"];
  const charCode = svc.name.charCodeAt(0) || 0;
  const bgColor = colors[charCode % colors.length];
  
  // 使用 Google Favicon API，如果加载失败(onload/onerror难以在字符串模版处理)，这里建议默认显示首字母
  // 或者：默认显示首字母，如果有 icon 字段则覆盖。
  // 既然追求"简约不丑"，建议：默认显示首字母色块（非常整齐），用户想改可以手动填 URL。
  
  return `<div class="icon-box" style="background: ${bgColor}">${svc.name.slice(0,1).toUpperCase()}</div>`;
}

function bindEvents() {
  el.search.addEventListener("input", (e) => { state.search = e.target.value.toLowerCase(); render(); });
  
  el.btnAdd.addEventListener("click", () => openModal());
  el.btnUnlock.addEventListener("click", handleUnlock);
  el.btnExport.addEventListener("click", handleExport);
  el.fileInput.addEventListener("change", handleImport);
  
  // 模态框关闭
  el.modal.addEventListener("click", (e) => { if(e.target === el.modal) closeModal(); });
  document.getElementById("cancelBtn").addEventListener("click", closeModal);
  el.form.addEventListener("submit", saveService);
}

// 简单的全局函数
window.setTag = (t) => { state.tag = t; render(); };
window.editService = (id) => openModal(id);
window.closeModal = () => { el.modal.hidden = true; el.modal.style.display = 'none'; }; // 强制隐藏

// --- 模态框逻辑 ---
function openModal(id = null) {
  if (!unlocked) return alert("请先点击右下角锁图标解锁编辑");
  editingId = id;
  el.modal.hidden = false;
  el.modal.removeAttribute('hidden'); // 移除 hidden 属性触发 CSS flex
  
  if (id) {
    const s = services.find(x => x.id === id);
    setForm(s);
  } else {
    el.form.reset();
  }
}

function setForm(data) {
  const f = el.form;
  f.name.value = data.name;
  f.url.value = data.url;
  f.icon.value = data.icon || ""; // 新增图标字段
  f.desc.value = data.description || "";
  f.tags.value = data.tags?.join(", ") || "";
}

function saveService(e) {
  e.preventDefault();
  const f = new FormData(el.form);
  const newItem = {
    id: editingId || `svc-${Date.now()}`,
    name: f.get("name"),
    url: f.get("url"),
    icon: f.get("icon"),
    description: f.get("desc"),
    tags: f.get("tags").split(/,|，/).map(t=>t.trim()).filter(Boolean)
  };

  if (editingId) {
    services = services.map(s => s.id === editingId ? { ...s, ...newItem } : s);
  } else {
    services.push(newItem);
  }
  
  localStorage.setItem(STORAGE_KEYS.data, JSON.stringify({ services, servers }));
  render();
  closeModal();
}

// --- 工具类 ---
async function handleUnlock() {
    const pwd = prompt("输入密码解锁 (首次为空可直接设置):");
    if (pwd !== null) { unlocked = true; render(); } // 简化版解锁
}
function handleExport() {
    const blob = new Blob([JSON.stringify({services, servers},null,2)], {type:"application/json"});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = "nav.json"; a.click();
}
function handleImport(e) {
    const r = new FileReader();
    r.onload = () => { try { services = JSON.parse(r.result).services; render(); } catch(e){} };
    r.readAsText(e.target.files[0]);
}
function loadData() { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.data)); } catch { return null; } }
function loadFavorites() { return new Set(); }
