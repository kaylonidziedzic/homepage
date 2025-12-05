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
  server: "",
  favoritesOnly: false,
  favorites: loadFavorites(),
};

const elements = {
  groups: document.getElementById("groups"),
  search: document.getElementById("searchInput"),
  clearSearch: document.getElementById("clearSearch"),
  tagFilter: document.getElementById("tagFilter"),
  serverFilter: document.getElementById("serverFilter"),
  favoriteFilter: document.getElementById("favoriteFilter"),
  tagChips: document.getElementById("tagChips"),
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
};

document.addEventListener("DOMContentLoaded", () => {
  const saved = loadData();
  services = saved?.services?.length ? saved.services : window.defaultServices;
  servers = saved?.servers?.length ? saved.servers : window.defaultServers;
  renderFilters();
  render();
  bindEvents();
});

function bindEvents() {
  elements.search.addEventListener("input", (e) => {
    state.search = e.target.value.trim().toLowerCase();
    render();
  });

  elements.clearSearch.addEventListener("click", () => {
    elements.search.value = "";
    state.search = "";
    render();
  });

  elements.tagFilter.addEventListener("change", (e) => {
    state.tag = e.target.value;
    render();
  });

  elements.serverFilter.addEventListener("change", (e) => {
    state.server = e.target.value;
    render();
  });

  elements.favoriteFilter.addEventListener("change", (e) => {
    state.favoritesOnly = e.target.checked;
    render();
  });

  elements.unlockButton.addEventListener("click", handleUnlock);
  elements.exportButton.addEventListener("click", handleExport);
  elements.importInput.addEventListener("change", handleImport);
  elements.resetForm.addEventListener("click", resetEditing);
  elements.cancelEdit.addEventListener("click", resetEditing);

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
        svc.id === editingId
          ? {
              ...svc,
              ...payload,
            }
          : svc
      );
      showToast("已保存修改");
    } else {
      const newService = {
        id: `svc-${Date.now()}`,
        ...payload,
      };
      services = [newService, ...services];
      showToast("已新增服务");
    }

    if (!servers.find((s) => s.name === payload.server)) {
      servers = [...servers, { name: payload.server, note: "" }];
    }
    persist();
    renderFilters();
    render();
    resetEditing();
  });
}

function renderFilters() {
  const serverOptions = ["", ...new Set(servers.map((s) => s.name))];
  elements.serverFilter.innerHTML = serverOptions
    .map((s) => `<option value="${s}">${s || "所有服务器"}</option>`)
    .join("");
  elements.serverFilter.value = state.server;

  const tags = new Set();
  services.forEach((svc) => svc.tags?.forEach((t) => tags.add(t)));
  const tagOptions = ["", ...tags];
  elements.tagFilter.innerHTML = tagOptions
    .map((t) => `<option value="${t}">${t || "所有标签"}</option>`)
    .join("");
  elements.tagFilter.value = state.tag;

  renderChips(tagOptions.filter(Boolean));
}

function renderChips(tagList) {
  elements.tagChips.innerHTML = tagList
    .map(
      (tag) =>
        `<button class="chip ${state.tag === tag ? "active" : ""}" data-tag="${tag}">${tag}</button>`
    )
    .join("");
  elements.tagChips.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.tag = chip.dataset.tag === state.tag ? "" : chip.dataset.tag;
      elements.tagFilter.value = state.tag;
      render();
    });
  });
}

function render() {
  const filtered = services.filter((svc) => {
    const matchesSearch = [
      svc.name,
      svc.description,
      svc.server,
      svc.tags?.join(" "),
    ]
      .filter(Boolean)
      .some((text) => text.toLowerCase().includes(state.search));

    const matchesTag = !state.tag || svc.tags?.includes(state.tag);
    const matchesServer = !state.server || svc.server === state.server;
    const matchesFavorite = !state.favoritesOnly || state.favorites.has(svc.id);
    return matchesSearch && matchesTag && matchesServer && matchesFavorite;
  });

  const groups = groupByPurpose(filtered);
  elements.groups.innerHTML = groups
    .map((group) => renderGroup(group.purpose, group.items))
    .join("") || `<div class="empty">没有匹配的服务</div>`;

  bindCardActions();
}

function renderGroup(purpose, items) {
  const count = items.length;
  const serverSet = new Set(items.map((i) => i.server));
  const serverText = Array.from(serverSet).join(", ");
  const cards = items.map(renderCard).join("");
  return `
    <div class="group">
      <div class="group-header">
        <div class="group-title">${purpose || "未分类"}</div>
        <div class="group-meta">${count} 个服务 · 服务器：${serverText}</div>
      </div>
      <div class="cards">${cards}</div>
    </div>
  `;
}

function renderCard(svc) {
  const favorite = state.favorites.has(svc.id);
  const tags = (svc.tags || [])
    .map((t) => `<span class="tag" data-tag="${t}">${t}</span>`)
    .join("");
  return `
    <article class="card" data-id="${svc.id}">
      <div class="title-row">
        <div>
          <div class="title">${svc.name}</div>
          <div class="desc">${svc.description || ""}</div>
        </div>
        <button class="favorite ${favorite ? "active" : ""}" title="收藏">${favorite ? "★" : "☆"}</button>
      </div>
      <div class="meta">
        <div><span class="label">用途：</span>${svc.purpose || "-"}</div>
        <div><span class="label">服务器：</span>${svc.server || "-"}</div>
        <div><span class="label">地址：</span>${svc.url}</div>
        <div><span class="label">端口：</span>${svc.port || "-"}</div>
        <div><span class="label">认证：</span>${svc.auth || "-"}</div>
      </div>
      <div class="tags">${tags}</div>
      <div class="actions">
        <a class="btn primary" href="${svc.url}" target="_blank" rel="noopener noreferrer">打开</a>
        <button class="btn secondary copy" data-url="${svc.url}">复制链接</button>
        <button class="btn secondary qr-btn" data-url="${svc.url}">二维码</button>
        <button class="btn tertiary edit" type="button">编辑</button>
      </div>
      <div class="qr" aria-hidden="true"></div>
    </article>
  `;
}

function bindCardActions() {
  document.querySelectorAll(".favorite").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.closest(".card").dataset.id;
      toggleFavorite(id);
      render();
    });
  });

  document.querySelectorAll(".copy").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const url = btn.dataset.url;
      try {
        await navigator.clipboard.writeText(url);
        showToast("已复制链接");
      } catch {
        showToast("复制失败，请检查权限", true);
      }
    });
  });

  document.querySelectorAll(".qr-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card");
      const box = card.querySelector(".qr");
      if (box.classList.contains("visible")) {
        box.classList.remove("visible");
        box.innerHTML = "";
        return;
      }
      document.querySelectorAll(".qr.visible").forEach((el) => {
        el.classList.remove("visible");
        el.innerHTML = "";
      });
      const img = document.createElement("img");
      const encoded = encodeURIComponent(btn.dataset.url);
      img.src = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encoded}`;
      img.alt = "QR";
      box.appendChild(img);
      box.classList.add("visible");
    });
  });

  document.querySelectorAll(".tag").forEach((tagEl) => {
    tagEl.addEventListener("click", () => {
      state.tag = tagEl.dataset.tag;
      elements.tagFilter.value = state.tag;
      render();
    });
  });

  document.querySelectorAll(".edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.closest(".card").dataset.id;
      startEdit(id);
    });
  });
}

function groupByPurpose(list) {
  const map = new Map();
  list.forEach((svc) => {
    const key = svc.purpose || "未分类";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(svc);
  });
  return Array.from(map.entries()).map(([purpose, items]) => ({ purpose, items }));
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(Array.from(state.favorites)));
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.favorites);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch (e) {
    console.error(e);
    return new Set();
  }
}

function persist() {
  const payload = { services, servers };
  localStorage.setItem(STORAGE_KEYS.data, JSON.stringify(payload));
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.data);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error(e);
    return null;
  }
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
    showToast("已设置密码并解锁");
    return;
  }
  const pwd = prompt("请输入编辑密码");
  if (!pwd) return;
  const hash = await sha256(pwd);
  if (hash === existing) {
    unlocked = true;
    afterUnlock();
    showToast("已解锁编辑");
  } else {
    showToast("密码错误", true);
  }
}

function afterUnlock() {
  elements.unlockButton.textContent = "✅ 已解锁";
  elements.exportButton.disabled = false;
  elements.importInput.disabled = false;
  elements.importInput.parentElement.setAttribute("aria-disabled", "false");
  elements.addFormSection.hidden = false;
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
      if (!Array.isArray(parsed.services) || !Array.isArray(parsed.servers)) {
        throw new Error("缺少 services 或 servers 数组");
      }
      services = parsed.services;
      servers = parsed.servers;
      resetEditing();
      persist();
      renderFilters();
      render();
      showToast("导入成功");
    } catch (e) {
      console.error(e);
      showToast("导入失败：" + e.message, true);
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
  elements.formSubtitle.textContent = `正在编辑：${svc.name}`;
  elements.submitBtn.textContent = "保存修改";
  elements.cancelEdit.hidden = false;

  elements.form.name.value = svc.name || "";
  elements.form.description.value = svc.description || "";
  elements.form.purpose.value = svc.purpose || "";
  elements.form.server.value = svc.server || "";
  elements.form.url.value = svc.url || "";
  elements.form.port.value = svc.port ?? "";
  elements.form.auth.value = svc.auth || "";
  elements.form.tags.value = (svc.tags || []).join(", ");
  elements.addFormSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetEditing() {
  editingId = null;
  elements.form.reset();
  elements.formTitle.textContent = "新增服务";
  elements.formSubtitle.textContent = "解锁后可新增或编辑，保存后本地自动记住";
  elements.submitBtn.textContent = "添加";
  elements.cancelEdit.hidden = true;
}

function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.style.background = isError ? "#b42318" : "#101828";
  elements.toast.classList.add("show");
  setTimeout(() => elements.toast.classList.remove("show"), 2000);
}

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
