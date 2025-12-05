const defaultData = {
  adminPassword: "navadmin",
  services: [
    {
      name: "Kubernetes Dashboard",
      description: "集群可视化与诊断入口",
      category: "运维监控",
      server: "ops-01",
      url: "https://ops01.internal:30001",
      port: 30001,
      auth: "OIDC / 集成登录",
      tags: ["prod", "k8s"],
      favorite: true,
    },
    {
      name: "Prometheus",
      description: "指标查询与告警配置",
      category: "运维监控",
      server: "ops-01",
      url: "https://ops01.internal:9090",
      port: 9090,
      auth: "Basic / monitor",
      tags: ["prod", "metrics"],
    },
    {
      name: "Grafana",
      description: "统一看板，包含服务器与业务指标",
      category: "运维监控",
      server: "ops-02",
      url: "https://ops02.internal:3000",
      port: 3000,
      auth: "SSO / LDAP",
      tags: ["prod", "dashboard"],
      favorite: true,
    },
    {
      name: "跳板机",
      description: "堡垒机入口，管理多台服务器登录",
      category: "访问入口",
      server: "edge-01",
      url: "https://edge01.internal",
      port: 443,
      auth: "MFA / 审计开启",
      tags: ["prod", "gateway"],
      favorite: true,
    },
    {
      name: "GitLab",
      description: "代码托管与 CI 平台",
      category: "研发协作",
      server: "dev-01",
      url: "https://gitlab.dev.local",
      port: 443,
      auth: "SSO / LDAP",
      tags: ["dev", "git"],
    },
    {
      name: "Harbor",
      description: "镜像仓库，支持多租户与签名",
      category: "研发协作",
      server: "dev-02",
      url: "https://harbor.dev.local",
      port: 443,
      auth: "Token / 个人访问密钥",
      tags: ["dev", "registry"],
    },
    {
      name: "Jenkins",
      description: "流水线中心，包含公共与项目专属 Job",
      category: "CI/CD",
      server: "ci-01",
      url: "https://jenkins.ci.internal",
      port: 8443,
      auth: "SSO / LDAP",
      tags: ["dev", "pipeline"],
      favorite: true,
    },
    {
      name: "测试环境入口",
      description: "统一测试环境站点列表",
      category: "环境入口",
      server: "qa-01",
      url: "https://portal.qa.internal",
      port: 443,
      auth: "Basic / qa-user",
      tags: ["test", "portal"],
    },
    {
      name: "对象存储管理",
      description: "S3 控制台，适合共享文件与备份",
      category: "存储与备份",
      server: "storage-01",
      url: "https://s3.storage.internal:9000",
      port: 9000,
      auth: "AccessKey / Console",
      tags: ["prod", "storage"],
    },
    {
      name: "PostgreSQL Admin",
      description: "数据库管理与 SQL 调试",
      category: "数据服务",
      server: "db-01",
      url: "https://db01.internal:5050",
      port: 5050,
      auth: "SSO / DBA",
      tags: ["prod", "db"],
    },
  ],
};

let state = {
  editMode: false,
  favoriteOnly: false,
  theme: localStorage.getItem("nav-theme") || "light",
};

const container = document.getElementById("serviceContainer");
const searchInput = document.getElementById("search");
const serverFilter = document.getElementById("serverFilter");
const tagFilter = document.getElementById("tagFilter");
const groupSelect = document.getElementById("groupSelect");
const favoriteOnlyBtn = document.getElementById("favoriteOnly");
const toggleThemeBtn = document.getElementById("toggleTheme");
const exportBtn = document.getElementById("exportBtn");
const importInput = document.getElementById("importInput");
const resetBtn = document.getElementById("resetBtn");
const addFormSection = document.getElementById("addForm");
const editToggleBtn = document.getElementById("editToggle");
const qrDialog = document.getElementById("qrDialog");
const qrCodeEl = document.getElementById("qrCode");
const qrTitle = document.getElementById("qrTitle");
const closeQr = document.getElementById("closeQr");

function loadData() {
  const saved = localStorage.getItem("nav-config");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (err) {
      console.error("配置解析失败，使用默认配置", err);
    }
  }
  return structuredClone(defaultData);
}

let data = loadData();

function persist() {
  localStorage.setItem("nav-config", JSON.stringify(data));
}

function initTheme() {
  document.documentElement.classList.toggle("dark", state.theme === "dark");
  toggleThemeBtn.textContent = state.theme === "dark" ? "☀️ 亮色" : "🌓 暗色";
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem("nav-theme", state.theme);
  initTheme();
}

function buildFilters() {
  const servers = new Set(data.services.map((s) => s.server));
  const tags = new Set(data.services.flatMap((s) => s.tags || []));
  const groups = new Set(data.services.map((s) => s.category));

  serverFilter.innerHTML = `<option value="">全部服务器</option>${[...servers]
    .sort()
    .map((s) => `<option value="${s}">${s}</option>`)
    .join("")}`;

  tagFilter.innerHTML = `<option value="">全部标签</option>${[...tags]
    .sort()
    .map((t) => `<option value="${t}">${t}</option>`)
    .join("")}`;

  groupSelect.innerHTML = `<option value="">全部用途</option>${[...groups]
    .sort()
    .map((g) => `<option value="${g}">${g}</option>`)
    .join("")}`;
}

function filterServices() {
  const q = searchInput.value.trim().toLowerCase();
  const server = serverFilter.value;
  const tag = tagFilter.value;
  const group = groupSelect.value;

  return data.services.filter((s) => {
    const matchQ = !q ||
      [s.name, s.description, s.server, ...(s.tags || [])].some((v) =>
        (v || "").toLowerCase().includes(q)
      );
    const matchServer = !server || s.server === server;
    const matchTag = !tag || (s.tags || []).includes(tag);
    const matchGroup = !group || s.category === group;
    const matchFav = !state.favoriteOnly || s.favorite;
    return matchQ && matchServer && matchTag && matchGroup && matchFav;
  });
}

function groupServices(list) {
  return list.reduce((acc, service) => {
    acc[service.category] = acc[service.category] || [];
    acc[service.category].push(service);
    return acc;
  }, {});
}

function tagHtml(tags = []) {
  return tags
    .map((tag) => `<span class="tag" data-tag="${tag}">#${tag}</span>`)
    .join("");
}

function render() {
  buildFilters();
  const filtered = filterServices();
  const grouped = groupServices(filtered);
  container.innerHTML = "";

  if (!filtered.length) {
    container.innerHTML = `<div class="card">未找到匹配的服务，试试调整筛选或搜索。</div>`;
    return;
  }

  Object.entries(grouped).forEach(([group, services]) => {
    const section = document.createElement("div");
    section.className = "group";
    section.innerHTML = `
      <div class="group__title">
        <strong>${group}</strong>
        <span class="badge">${services.length} 个服务</span>
      </div>
      <div class="card-grid">
        ${services
          .map(
            (service, idx) => `
              <article class="card">
                <div class="card__header">
                  <h3>
                    ${service.name}
                    ${service.favorite ? "<span aria-label=\"收藏\">⭐</span>" : ""}
                  </h3>
                  <div class="card__meta">
                    <span>服务器：${service.server}</span>
                    <span>端口：${service.port || "默认"}</span>
                  </div>
                </div>
                <p class="card__desc">${service.description || ""}</p>
                <div class="card__footer">
                  <span class="badge">认证：${service.auth || "-"}</span>
                  <span class="badge">地址：${service.url}</span>
                </div>
                <div class="tag-list">${tagHtml(service.tags)}</div>
                <div class="card__actions">
                  <button class="link-btn primary" data-action="open" data-url="${service.url}">🔗 打开</button>
                  <button class="link-btn" data-action="copy" data-url="${service.url}">📋 复制</button>
                  <button class="link-btn" data-action="qr" data-url="${service.url}" data-name="${service.name}">🧾 二维码</button>
                  <button class="link-btn" data-action="favorite" data-index="${data.services.indexOf(service)}">${service.favorite ? "💛 取消常用" : "🤍 标记常用"}</button>
                  ${state.editMode ? `<button class="link-btn" data-action="remove" data-index="${data.services.indexOf(service)}">🗑️ 删除</button>` : ""}
                </div>
              </article>
            `
          )
          .join("")}
      </div>
    `;
    container.append(section);
  });
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("已复制到剪贴板");
  });
}

function showQr(url, name) {
  qrCodeEl.innerHTML = "";
  new QRCode(qrCodeEl, {
    text: url,
    width: 200,
    height: 200,
  });
  qrTitle.textContent = `${name} 的二维码`;
  qrDialog.showModal();
}

function handleActions(e) {
  const action = e.target.dataset.action;
  if (!action) return;

  switch (action) {
    case "open":
      window.open(e.target.dataset.url, "_blank");
      break;
    case "copy":
      copyText(e.target.dataset.url);
      break;
    case "qr":
      showQr(e.target.dataset.url, e.target.dataset.name);
      break;
    case "favorite": {
      const idx = Number(e.target.dataset.index);
      data.services[idx].favorite = !data.services[idx].favorite;
      persist();
      render();
      break;
    }
    case "remove": {
      if (!state.editMode) return;
      const idx = Number(e.target.dataset.index);
      if (confirm(`确认删除 ${data.services[idx].name}？`)) {
        data.services.splice(idx, 1);
        persist();
        render();
      }
      break;
    }
  }
}

function handleTagClick(e) {
  if (!e.target.classList.contains("tag")) return;
  const tag = e.target.dataset.tag;
  tagFilter.value = tag;
  render();
}

function handleFavoriteOnly() {
  state.favoriteOnly = !state.favoriteOnly;
  favoriteOnlyBtn.classList.toggle("btn--accent", state.favoriteOnly);
  favoriteOnlyBtn.textContent = state.favoriteOnly ? "⭐ 仅常用" : "⭐ 常用";
  render();
}

function exportConfig() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "service-nav.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importConfig(file) {
  if (!state.editMode) {
    alert("请先启用编辑模式（需要密码）");
    return;
  }
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const parsed = JSON.parse(evt.target.result);
      if (!parsed.services || !Array.isArray(parsed.services)) {
        throw new Error("无效配置：缺少 services 数组");
      }
      data = parsed;
      persist();
      render();
      alert("导入成功");
    } catch (err) {
      alert("导入失败: " + err.message);
    }
  };
  reader.readAsText(file);
}

function resetConfig() {
  if (!state.editMode) {
    alert("请先启用编辑模式（需要密码）");
    return;
  }
  if (confirm("确认恢复默认示例数据？")) {
    data = structuredClone(defaultData);
    persist();
    render();
  }
}

function enableEditMode() {
  const input = prompt("请输入编辑密码", "");
  if (input === data.adminPassword) {
    state.editMode = true;
    addFormSection.hidden = false;
    editToggleBtn.textContent = "✅ 编辑中";
    editToggleBtn.classList.add("btn--accent");
  } else {
    alert("密码错误，无法进入编辑模式");
  }
}

function handleAddService(e) {
  e.preventDefault();
  if (!state.editMode) return;
  const form = e.target;
  const service = {
    name: form.name.value.trim(),
    description: form.description.value.trim(),
    category: form.category.value.trim(),
    server: form.server.value.trim(),
    url: form.url.value.trim(),
    port: form.port.value ? Number(form.port.value) : null,
    auth: form.auth.value.trim(),
    tags: form.tags.value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  };
  data.services.push(service);
  form.reset();
  persist();
  render();
  alert("已添加");
}

function setupListeners() {
  searchInput.addEventListener("input", render);
  serverFilter.addEventListener("change", render);
  tagFilter.addEventListener("change", render);
  groupSelect.addEventListener("change", render);
  favoriteOnlyBtn.addEventListener("click", handleFavoriteOnly);
  toggleThemeBtn.addEventListener("click", toggleTheme);
  exportBtn.addEventListener("click", exportConfig);
  importInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) importConfig(file);
    importInput.value = "";
  });
  resetBtn.addEventListener("click", resetConfig);
  editToggleBtn.addEventListener("click", enableEditMode);
  container.addEventListener("click", handleActions);
  container.addEventListener("click", handleTagClick);
  document.querySelector("#addForm form").addEventListener("submit", handleAddService);
  closeQr.addEventListener("click", () => qrDialog.close());
}

initTheme();
setupListeners();
render();
