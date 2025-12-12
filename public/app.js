const STORAGE_KEYS = { favorites: "nav-favorites", data: "nav-data", password: "nav-password" };
let profile = {};
let projects = [];
let githubConfig = {};
let unlocked = false;
let editingId = null;
const state = { search: "", tag: "", favoritesOnly: false, favorites: new Set() };

const el = {
  clock: document.getElementById("clock"),
  date: document.getElementById("date"),
  mainContent: document.getElementById("mainContent"),
  search: document.getElementById("searchInput"),
  tagChips: document.getElementById("tagChips"),

  // 个人信息区元素
  profileSection: document.getElementById("profileSection"),
  profileAvatar: document.getElementById("profileAvatar"),
  profileName: document.getElementById("profileName"),
  profileBio: document.getElementById("profileBio"),
  profileLocation: document.getElementById("profileLocation"),
  socialLinks: document.getElementById("socialLinks"),

  modal: document.getElementById("modalOverlay"),
  form: document.getElementById("serviceForm"),
  btnDelete: document.getElementById("btnDelete"),

  // GitHub 配置元素
  githubModal: document.getElementById("githubModalOverlay"),
  githubForm: document.getElementById("githubForm"),
  githubEnabled: document.getElementById("githubEnabled"),
  githubUsername: document.getElementById("githubUsername"),
  githubToken: document.getElementById("githubToken"),
  excludeForked: document.getElementById("excludeForked"),
  excludePrivate: document.getElementById("excludePrivate"),

  btnUnlock: document.getElementById("btnUnlock"),
  btnAdd: document.getElementById("btnAdd"),
  btnGithub: document.getElementById("btnGithub"),
  btnExport: document.getElementById("btnExport"),
  fileInput: document.getElementById("fileInput")
};

// --- 1. 初始化 (改为异步加载) ---
document.addEventListener("DOMContentLoaded", async () => {
  // 尝试从 API 加载数据
  const apiData = await loadFromAPI();

  // 如果 API 返回了数据，就用 API 的；否则用默认的
  const data = apiData || window.defaultData || {};
  profile = data.profile || window.defaultData?.profile || {};
  githubConfig = data.githubConfig || window.defaultData?.githubConfig || {};
  projects = data.projects || data.services || window.defaultServices || [];

  startClock();
  renderProfile();
  render();
  bindEvents();

  // 如果启用了 GitHub 同步，自动拉取
  if (githubConfig.enabled && githubConfig.username) {
    await syncGithubRepos();
  }
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
    const payload = { profile, githubConfig, projects };
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

// --- 4. 渲染个人信息区 ---
function renderProfile() {
  if (!profile || !profile.name) return;

  el.profileAvatar.src = profile.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Default";
  el.profileName.textContent = profile.name || "未设置";
  el.profileBio.textContent = profile.bio || "";
  el.profileLocation.innerHTML = profile.location ? `📍 ${profile.location}` : "";

  // 渲染社交链接
  if (profile.socials && profile.socials.length > 0) {
    el.socialLinks.innerHTML = profile.socials.map(s =>
      `<a href="${s.url}" class="social-link" target="_blank" rel="noopener">
        <span class="icon">${s.icon}</span>
        <span>${s.name}</span>
      </a>`
    ).join("");
  }
}

// --- 5. 渲染项目列表 ---
function render() {
  // 生成顶部标签
  const allTags = new Set();
  projects.forEach(s => s.tags?.forEach(t => allTags.add(t)));
  const chipsHTML = [`<div class="chip ${state.tag===''?'active':''}" onclick="setTag('')">全部</div>`]
    .concat([...allTags].map(t => `<div class="chip ${state.tag===t?'active':''}" onclick="setTag('${t}')">${t}</div>`));
  el.tagChips.innerHTML = chipsHTML.join("");

  // 准备内容
  let contentHTML = "";
  const isDefaultView = !state.search && !state.tag;

  if (isDefaultView) {
    // 分组视图
    const noTagProjects = projects.filter(s => !s.tags || s.tags.length === 0);
    if (noTagProjects.length > 0) contentHTML += renderGroup("未分类", noTagProjects);

    allTags.forEach(tag => {
      const groupProjects = projects.filter(s => s.tags?.includes(tag));
      if (groupProjects.length > 0) contentHTML += renderGroup(tag, groupProjects);
    });
  } else {
    // 筛选视图
    const filtered = projects.filter(s => {
      const matchText = (s.name+s.url+s.tags?.join("")).toLowerCase().includes(state.search);
      const matchTag = !state.tag || s.tags?.includes(state.tag);
      return matchText && matchTag;
    });

    if (filtered.length === 0) {
      contentHTML = `<div style="text-align:center;color:#999;padding:40px;">未找到匹配的项目</div>`;
    } else {
      contentHTML = `<div class="cards-grid">${filtered.map(renderCard).join("")}</div>`;
    }
  }

  el.mainContent.innerHTML = contentHTML;
}

function renderGroup(title, items) {
  return `<section><div class="group-title">${title}</div><div class="cards-grid">${items.map(renderCard).join("")}</div></section>`;
}

function renderCard(proj) {
  const iconHtml = getIconHtml(proj);
  const editBtn = unlocked && proj.source === 'manual'
    ? `<button class="card-edit" onclick="event.stopPropagation(); openEdit('${proj.id}')">✎</button>` : '';

  let domain = proj.url;
  try { domain = new URL(proj.url).hostname; } catch(e){}
  const desc = proj.description || domain;

  // 状态标签
  const statusHtml = proj.status
    ? `<div class="card-status status-${proj.status}">${proj.status}</div>`
    : '';

  // GitHub 来源标签（如果是 GitHub 同步的项目）
  const githubBadge = proj.source === 'github'
    ? `<div class="card-github-badge" title="来自 GitHub">🐙</div>`
    : '';

  // Stars 显示
  const starsHtml = proj.stars !== undefined && proj.stars > 0
    ? `<span class="card-stars">⭐ ${proj.stars}</span>`
    : '';

  // 技术栈标签
  const techItems = [];
  if (proj.language) techItems.push(proj.language);
  if (proj.tech) techItems.push(...proj.tech);

  const techHtml = techItems.length > 0
    ? `<div class="card-tech">${techItems.slice(0, 5).map(t => `<span class="tech-tag">${t}</span>`).join('')}</div>`
    : '';

  return `
    <div class="card" onclick="window.open('${proj.url}', '_blank')">
      ${statusHtml}
      ${githubBadge}
      <div class="card-header">
        ${iconHtml}
        <div class="card-info">
          <div class="card-name">${proj.name} ${starsHtml}</div>
          <div class="card-desc">${desc}</div>
        </div>
      </div>
      ${techHtml}
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
    const proj = projects.find(x => x.id === id);
    el.form.name.value = proj.name;
    el.form.url.value = proj.url;
    el.form.icon.value = proj.icon || "";
    el.form.desc.value = proj.description || "";
    el.form.status.value = proj.status || "";
    el.form.tech.value = proj.tech?.join(", ") || "";
    el.form.tags.value = proj.tags?.join(", ") || "";
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
    const blob = new Blob([JSON.stringify({profile, projects},null,2)], {type:"application/json"});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = "nav_backup.json"; a.click();
  });

  // 导入按钮 (改为导入后自动同步上传到服务器)
  el.fileInput.addEventListener("change", (e) => {
    const r = new FileReader();
    r.onload = async () => {
      try {
        const data = JSON.parse(r.result);
        profile = data.profile || profile;
        projects = data.projects || data.services || [];
        renderProfile();
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
      id: editingId || `proj-${Date.now()}`,
      name: f.get("name"),
      url: f.get("url"),
      icon: f.get("icon"),
      description: f.get("desc"),
      status: f.get("status"),
      tech: f.get("tech").split(/[,，]/).map(t=>t.trim()).filter(Boolean),
      tags: f.get("tags").split(/[,，]/).map(t=>t.trim()).filter(Boolean)
    };

    if(editingId) {
      projects = projects.map(s => s.id === editingId ? item : s);
    } else {
      projects.push(item);
    }

    // 👈 核心修改：保存到服务器，而不是 localStorage
    await saveToAPI();
    closeModal();
  });

  // 删除按钮
  el.btnDelete.addEventListener("click", async () => {
    if(confirm("确定删除吗？")) {
      projects = projects.filter(s => s.id !== editingId);
      // 👈 核心修改：同步删除操作
      await saveToAPI();
      closeModal();
    }
  });

  el.modal.addEventListener("click", (e) => { if(e.target===el.modal) closeModal(); });

  // GitHub 按钮事件
  el.btnGithub.addEventListener("click", () => {
    openGithubModal();
  });

  // GitHub 配置表单提交
  el.githubForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await saveGithubConfig();
  });

  // 测试 GitHub 连接
  document.getElementById("btnTestGithub").addEventListener("click", async () => {
    await testGithubConnection();
  });

  el.githubModal.addEventListener("click", (e) => { if(e.target===el.githubModal) closeGithubModal(); });
}

// --- GitHub 同步功能 ---

// 打开 GitHub 配置模态框
function openGithubModal() {
  el.githubModal.hidden = false;
  el.githubModal.removeAttribute('hidden');

  // 填充当前配置
  el.githubEnabled.checked = githubConfig.enabled || false;
  el.githubUsername.value = githubConfig.username || '';
  el.githubToken.value = githubConfig.token || '';
  el.excludeForked.checked = githubConfig.excludeForked !== false;
  el.excludePrivate.checked = githubConfig.excludePrivate || false;
}

// 关闭 GitHub 配置模态框
window.closeGithubModal = () => {
  el.githubModal.hidden = true;
  el.githubModal.setAttribute('hidden', '');
};

// 测试 GitHub 连接
async function testGithubConnection() {
  const username = el.githubUsername.value.trim();
  const token = el.githubToken.value.trim();

  if (!username) {
    alert("请先填写 GitHub 用户名");
    return;
  }

  try {
    const url = `/api/github/repos?username=${username}${token ? '&token=' + token : ''}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`API 请求失败: ${res.status}`);
    }

    const repos = await res.json();
    alert(`✅ 连接成功！找到 ${repos.length} 个仓库`);
  } catch (error) {
    alert(`❌ 连接失败: ${error.message}`);
  }
}

// 保存 GitHub 配置并同步
async function saveGithubConfig() {
  githubConfig = {
    enabled: el.githubEnabled.checked,
    username: el.githubUsername.value.trim(),
    token: el.githubToken.value.trim(),
    syncRepos: true,
    excludeForked: el.excludeForked.checked,
    excludePrivate: el.excludePrivate.checked
  };

  if (githubConfig.enabled && !githubConfig.username) {
    alert("请填写 GitHub 用户名");
    return;
  }

  closeGithubModal();

  // 如果启用了同步，立即拉取
  if (githubConfig.enabled && githubConfig.username) {
    await syncGithubRepos();
  } else {
    // 如果禁用了同步，删除所有 GitHub 来源的项目
    projects = projects.filter(p => p.source !== 'github');
  }

  // 保存到服务器
  await saveToAPI();
}

// 同步 GitHub 仓库
async function syncGithubRepos() {
  if (!githubConfig.username) return;

  try {
    const url = `/api/github/repos?username=${githubConfig.username}${githubConfig.token ? '&token=' + githubConfig.token : ''}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`GitHub API 请求失败: ${res.status}`);
    }

    const repos = await res.json();

    // 过滤仓库
    let filteredRepos = repos;
    if (githubConfig.excludeForked) {
      filteredRepos = filteredRepos.filter(r => !r.isFork);
    }
    if (githubConfig.excludePrivate) {
      filteredRepos = filteredRepos.filter(r => !r.isPrivate);
    }

    // 删除旧的 GitHub 项目
    projects = projects.filter(p => p.source !== 'github');

    // 添加新的 GitHub 项目
    const githubProjects = filteredRepos.map(repo => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      url: repo.url,
      homepage: repo.homepage,
      icon: '📦',
      stars: repo.stars,
      language: repo.language,
      tech: repo.topics,
      tags: repo.topics.length > 0 ? repo.topics : ['GitHub'],
      lastUpdate: repo.lastUpdate,
      source: 'github'
    }));

    projects = [...projects, ...githubProjects];
    render();

    console.log(`✅ 已同步 ${githubProjects.length} 个 GitHub 仓库`);
  } catch (error) {
    console.error('GitHub 同步失败:', error);
    alert(`❌ GitHub 同步失败: ${error.message}`);
  }
}
