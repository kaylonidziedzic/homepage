const STORAGE_KEYS = { favorites: "nav-favorites", data: "nav-data", password: "nav-password" };
let services = []; let servers = []; let unlocked = false; let editingId = null;
const state = { search: "", tag: "", favoritesOnly: false, favorites: new Set() };

const el = {
  clock: document.getElementById("clock"),
  date: document.getElementById("date"),
  mainContent: document.getElementById("mainContent"),
  search: document.getElementById("searchInput"),
  tagChips: document.getElementById("tagChips"),
  
  modal: document.getElementById("modalOverlay"),
  form: document.getElementById("serviceForm"),
  btnDelete: document.getElementById("btnDelete"),
  
  btnUnlock: document.getElementById("btnUnlock"),
  btnAdd: document.getElementById("btnAdd"),
  btnExport: document.getElementById("btnExport"),
  fileInput: document.getElementById("fileInput")
};

// --- 1. 初始化 (改为异步加载) ---
document.addEventListener("DOMContentLoaded", async () => {
  // 尝试从 API 加载数据
  const apiData = await loadFromAPI();
  
  // 如果 API 返回了数据，就用 API 的；否则用默认的
  services = apiData?.services || window.defaultServices || [];
  
  startClock();
  render();
  bindEvents();
});

// --- 2. 核心 API 通信函数 (新增) ---

// 从后端获取数据
async function loadFromAPI() {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error("API连接失败");
    return await res.json();
  } catch (e) {
    console.warn("无法连接后端，使用默认数据或本地缓存:", e);
    // 如果后端挂了，可以尝试读取本地缓存兜底 (可选)
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.data)); } catch {}
    return null;
  }
}

// 保存数据到后端
async function saveToAPI() {
  try {
    const payload = { services: services };
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      render(); // 重新渲染页面
      // 顺便也存一份本地，作为断网时的备份
      localStorage.setItem(STORAGE_KEYS.data, JSON.stringify(payload));
      alert("✅ 已同步到服务器");
    } else {
      throw new Error("服务器返回错误");
    }
  } catch (e) {
    alert("❌ 保存失败: " + e.message);
  }
}

// --- 3. 时钟逻辑 ---
function startClock() {
  const update = () => {
    const now = new Date();
    el.clock.textContent = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const opts = { year:'numeric', month:'long', day:'numeric', weekday:'long' };
    el.date.textContent = now.toLocaleDateString('zh-CN', opts);
  };
  setInterval(update, 1000); update();
}

// --- 4. 渲染逻辑 ---
function render() {
  // 生成顶部标签
  const allTags = new Set();
  services.forEach(s => s.tags?.forEach(t => allTags.add(t)));
  const chipsHTML = [`<div class="chip ${state.tag===''?'active':''}" onclick="setTag('')">全部</div>`]
    .concat([...allTags].map(t => `<div class="chip ${state.tag===t?'active':''}" onclick="setTag('${t}')">${t}</div>`));
  el.tagChips.innerHTML = chipsHTML.join("");

  // 准备内容
  let contentHTML = "";
  const isDefaultView = !state.search && !state.tag;

  if (isDefaultView) {
    // 分组视图
    const noTagServices = services.filter(s => !s.tags || s.tags.length === 0);
    if (noTagServices.length > 0) contentHTML += renderGroup("未分类", noTagServices);
    
    allTags.forEach(tag => {
      const groupServices = services.filter(s => s.tags?.includes(tag));
      if (groupServices.length > 0) contentHTML += renderGroup(tag, groupServices);
    });
  } else {
    // 筛选视图
    const filtered = services.filter(s => {
      const matchText = (s.name+s.url+s.tags?.join("")).toLowerCase().includes(state.search);
      const matchTag = !state.tag || s.tags?.includes(state.tag);
      return matchText && matchTag;
    });
    
    if (filtered.length === 0) {
      contentHTML = `<div style="text-align:center;color:#999;padding:40px;">未找到匹配的服务</div>`;
    } else {
      contentHTML = `<div class="cards-grid">${filtered.map(renderCard).join("")}</div>`;
    }
  }

  el.mainContent.innerHTML = contentHTML;
}

function renderGroup(title, items) {
  return `<section><div class="group-title">${title}</div><div class="cards-grid">${items.map(renderCard).join("")}</div></section>`;
}

function renderCard(svc) {
  const iconHtml = getIconHtml(svc);
  const editBtn = unlocked 
    ? `<button class="card-edit" onclick="event.stopPropagation(); openEdit('${svc.id}')">✎</button>` : '';

  let domain = svc.url;
  try { domain = new URL(svc.url).hostname; } catch(e){}
  const desc = svc.description || domain;

  return `
    <div class="card" onclick="window.open('${svc.url}', '_blank')">
      ${iconHtml}
      <div class="card-info">
        <div class="card-name">${svc.name}</div>
        <div class="card-desc">${desc}</div>
      </div>
      ${editBtn}
    </div>
  `;
}

function getIconHtml(svc) {
  if (svc.icon && !svc.icon.startsWith("http") && svc.icon.length < 8) {
    return `<div class="card-icon-box" style="background:#f0f0f5; font-size:26px;">${svc.icon}</div>`;
  }
  if (svc.icon && svc.icon.startsWith("http")) {
    return `<div class="card-icon-box" style="background:transparent;"><img src="${svc.icon}" class="card-icon-img"></div>`;
  }
  const colors = [
    "linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)",
    "linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)",
    "linear-gradient(120deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)",
    "linear-gradient(120deg, #fccb90 0%, #d57eeb 100%)",
    "linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)",
  ];
  const idx = (svc.name.charCodeAt(0) || 0) % colors.length;
  const bg = colors[idx];
  return `<div class="card-icon-box" style="background:${bg};">${svc.name[0].toUpperCase()}</div>`;
}

// --- 5. 交互与事件 ---
window.setTag = (t) => { state.tag = t; render(); };

window.openEdit = (id) => {
  if (!unlocked) return;
  editingId = id;
  el.modal.hidden = false; el.modal.removeAttribute('hidden');
  
  if (id) {
    const s = services.find(x => x.id === id);
    el.form.name.value = s.name;
    el.form.url.value = s.url;
    el.form.icon.value = s.icon || "";
    el.form.desc.value = s.description || "";
    el.form.tags.value = s.tags?.join(", ") || "";
    el.btnDelete.hidden = false;
  } else {
    el.form.reset();
    el.btnDelete.hidden = true;
  }
};
window.closeModal = () => { el.modal.hidden = true; el.modal.setAttribute('hidden',''); };

function bindEvents() {
  el.search.addEventListener("input", (e) => { state.search = e.target.value.toLowerCase(); render(); });
  
  el.btnAdd.addEventListener("click", () => {
    if(!unlocked) return alert("请先点击左下角的 🔒 解锁编辑");
    openEdit(null);
  });
  
  el.btnUnlock.addEventListener("click", () => {
    const pwd = prompt("请输入密码解锁:");
    if(pwd) { unlocked = true; el.btnUnlock.textContent = "🔓"; render(); }
  });
  
  // 导出按钮 (依然保留，作为本地备份功能)
  el.btnExport.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({services},null,2)], {type:"application/json"});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = "nav_backup.json"; a.click();
  });
  
  // 导入按钮 (改为导入后自动同步上传到服务器)
  el.fileInput.addEventListener("change", (e) => {
    const r = new FileReader();
    r.onload = async () => { 
      try { 
        services = JSON.parse(r.result).services; 
        await saveToAPI(); // 👈 导入后直接保存到服务器
        alert("导入成功并已同步！"); 
      } catch(err){ alert("文件格式错误"); } 
    };
    r.readAsText(e.target.files[0]);
  });
  
  // 表单提交 (新增/修改)
  el.form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(el.form);
    const item = {
      id: editingId || `svc-${Date.now()}`,
      name: f.get("name"),
      url: f.get("url"),
      icon: f.get("icon"),
      description: f.get("desc"),
      tags: f.get("tags").split(/[,，]/).map(t=>t.trim()).filter(Boolean)
    };
    
    if(editingId) {
      services = services.map(s => s.id === editingId ? item : s);
    } else {
      services.push(item);
    }
    
    // 👈 核心修改：保存到服务器，而不是 localStorage
    await saveToAPI();
    closeModal();
  });
  
  // 删除按钮
  el.btnDelete.addEventListener("click", async () => {
    if(confirm("确定删除吗？")) {
      services = services.filter(s => s.id !== editingId);
      // 👈 核心修改：同步删除操作
      await saveToAPI();
      closeModal();
    }
  });

  el.modal.addEventListener("click", (e) => { if(e.target===el.modal) closeModal(); });
}
