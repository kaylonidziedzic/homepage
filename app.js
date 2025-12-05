/* 保持数据键值不变，方便兼容旧数据 */
const STORAGE_KEYS = { favorites: "nav-favorites", data: "nav-data", password: "nav-password" };
let services = []; let servers = []; let unlocked = false; let editingId = null;
const state = { search: "", tag: "", favoritesOnly: false, favorites: new Set() };

// DOM 引用
const el = {
  clock: document.getElementById("clock"),
  date: document.getElementById("date"),
  cards: document.getElementById("cards"),
  search: document.getElementById("searchInput"),
  tagChips: document.getElementById("tagChips"),
  
  modal: document.getElementById("modalOverlay"),
  form: document.getElementById("serviceForm"),
  
  btnUnlock: document.getElementById("btnUnlock"),
  btnAdd: document.getElementById("btnAdd"),
  btnExport: document.getElementById("btnExport"),
  fileInput: document.getElementById("fileInput")
};

document.addEventListener("DOMContentLoaded", () => {
  const saved = loadData();
  services = saved?.services || window.defaultServices || [];
  servers = saved?.servers || [];
  
  startClock();
  render();
  bindEvents();
});

// 时钟逻辑
function startClock() {
  const update = () => {
    const now = new Date();
    el.clock.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    el.date.textContent = now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  };
  setInterval(update, 1000); update();
}

// 核心渲染
function render() {
  // 1. 渲染标签
  const tags = new Set(); services.forEach(s => s.tags?.forEach(t => tags.add(t)));
  const chipsHTML = [`<div class="chip ${state.tag===''?'active':''}" onclick="filterTag('')">全部</div>`]
    .concat([...tags].map(t => `<div class="chip ${state.tag===t?'active':''}" onclick="filterTag('${t}')">${t}</div>`));
  el.tagChips.innerHTML = chipsHTML.join("");

  // 2. 过滤数据
  const filtered = services.filter(s => {
    const matchText = (s.name + s.url + s.tags?.join("")).toLowerCase().includes(state.search);
    const matchTag = !state.tag || s.tags?.includes(state.tag);
    return matchText && matchTag;
  });

  // 3. 渲染卡片
  el.cards.innerHTML = filtered.map(svc => {
    // 允许编辑按钮出现
    const editBtn = unlocked 
      ? `<button class="edit-btn" onclick="event.stopPropagation(); openEdit('${svc.id}')">✎</button>` 
      : '';
      
    return `
      <div class="card" onclick="window.open('${svc.url}', '_blank')">
        <div class="card-head">
          ${getIcon(svc)}
          ${editBtn}
        </div>
        <div class="card-body">
          <div class="card-name">${svc.name}</div>
          <div class="card-meta">${svc.description || extractDomain(svc.url)}</div>
        </div>
      </div>
    `;
  }).join("") || `<div style="grid-column:1/-1;text-align:center;color:#999;padding:20px;">空空如也</div>`;
}

// 图标生成逻辑
function getIcon(svc) {
  // 1. Emoji (短字符串)
  if (svc.icon && !svc.icon.startsWith("http") && svc.icon.length < 8) {
    return `<div class="card-icon-box" style="background:#f2f2f7; font-size:24px;">${svc.icon}</div>`;
  }
  // 2. 图片 URL
  if (svc.icon && svc.icon.startsWith("http")) {
    return `<div class="card-icon-box" style="background:transparent;"><img src="${svc.icon}" class="card-icon-img"></div>`;
  }
  // 3. 默认：首字母 + 鲜艳色块 (Mac 文件夹风格)
  // 调整了配色，使其在白色背景上更通透
  const colors = [
    "linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)", // Pinky
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)", // Purple
    "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)", // Blue Green
    "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)", // Orange
    "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)", // Light Blue
  ];
  const charCode = svc.name.charCodeAt(0) || 0;
  const bg = colors[charCode % colors.length];
  
  return `<div class="card-icon-box" style="background:${bg}; text-shadow:0 1px 2px rgba(0,0,0,0.1);">${svc.name[0].toUpperCase()}</div>`;
}

// 工具函数
function extractDomain(url) {
  try { return new URL(url).hostname; } catch { return url; }
}
window.filterTag = (t) => { state.tag = t; render(); };
window.openEdit = (id) => {
  if(!unlocked) return;
  editingId = id;
  el.modal.hidden = false; el.modal.removeAttribute('hidden');
  const s = id ? services.find(x=>x.id===id) : {name:'', url:'', icon:'', description:'', tags:[]};
  
  const f = el.form;
  f.name.value = s.name || '';
  f.url.value = s.url || '';
  f.icon.value = s.icon || '';
  f.desc.value = s.description || '';
  f.tags.value = s.tags?.join(", ") || '';
};
window.closeModal = () => { el.modal.hidden = true; el.modal.setAttribute('hidden', ''); };

// 事件绑定
function bindEvents() {
  el.search.addEventListener("input", (e) => { state.search = e.target.value.toLowerCase(); render(); });
  
  el.btnAdd.addEventListener("click", () => {
    if(!unlocked) return alert("请先点击锁图标解锁");
    openEdit(null);
  });
  
  el.btnUnlock.addEventListener("click", () => {
    const pwd = prompt("输入密码解锁编辑:");
    if(pwd) { unlocked = true; el.btnUnlock.innerText = '🔓'; render(); }
  });
  
  el.btnExport.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({services,servers},null,2)], {type:"application/json"});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = "nav.json"; a.click();
  });
  
  el.fileInput.addEventListener("change", (e) => {
    const r = new FileReader();
    r.onload = () => { try { services = JSON.parse(r.result).services; render(); } catch{} };
    r.readAsText(e.target.files[0]);
  });
  
  el.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(el.form);
    const item = {
      id: editingId || `svc-${Date.now()}`,
      name: f.get("name"), url: f.get("url"), icon: f.get("icon"),
      description: f.get("desc"), tags: f.get("tags").split(/[,，]/).map(t=>t.trim()).filter(Boolean)
    };
    if(editingId) services = services.map(s=>s.id===editingId?{...s,...item}:s);
    else services.push(item);
    
    localStorage.setItem(STORAGE_KEYS.data, JSON.stringify({services}));
    render(); closeModal();
  });
  
  el.modal.addEventListener("click", (e) => { if(e.target === el.modal) closeModal(); });
}

function loadData() { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.data)); } catch { return null; } }
