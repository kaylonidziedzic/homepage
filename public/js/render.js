/**
 * 渲染模块
 */
const Render = {
  /**
   * 启动时钟
   */
  startClock() {
    const update = () => {
      const now = new Date();
      AppState.el.clock.textContent = Utils.formatTime(now);
      AppState.el.date.textContent = Utils.formatDate(now);
    };
    setInterval(update, 1000);
    update();
  },

  /**
   * 渲染个人信息区
   */
  profile() {
    const { profile, el } = AppState;
    if (!profile || !profile.name) return;

    el.profileAvatar.src = profile.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Default";
    el.profileName.textContent = profile.name || "未设置";
    el.profileBio.textContent = profile.bio || "";
    el.profileLocation.innerHTML = profile.location
      ? `📍 ${Utils.escapeHtml(profile.location)}`
      : "";

    // 渲染社交链接
    if (profile.socials?.length > 0) {
      el.socialLinks.innerHTML = profile.socials.map(s => {
        const safeUrl = Utils.isValidUrl(s.url) ? s.url : '#';
        return `<a href="${Utils.escapeHtml(safeUrl)}" class="social-link" target="_blank" rel="noopener">
          <span class="icon">${Utils.escapeHtml(s.icon)}</span>
          <span>${Utils.escapeHtml(s.name)}</span>
        </a>`;
      }).join("");
    }
  },

  /**
   * 渲染主内容区（标签 + 项目列表）
   */
  main() {
    this.tags();
    this.projects();
  },

  /**
   * 渲染标签栏
   */
  tags() {
    const allTags = AppState.getAllTags();
    const currentTag = AppState.filter.tag;

    const chipsHTML = [
      `<div class="chip ${currentTag === '' ? 'active' : ''}" data-tag="">全部</div>`
    ].concat(
      [...allTags].map(t =>
        `<div class="chip ${currentTag === t ? 'active' : ''}" data-tag="${Utils.escapeHtml(t)}">${Utils.escapeHtml(t)}</div>`
      )
    );

    AppState.el.tagChips.innerHTML = chipsHTML.join("");
  },

  /**
   * 渲染项目列表
   */
  projects() {
    const { filter, projects } = AppState;
    const isDefaultView = !filter.search && !filter.tag;
    let contentHTML = "";

    if (isDefaultView) {
      // 分组视图
      const allTags = AppState.getAllTags();
      const noTagProjects = projects.filter(p => !p.tags || p.tags.length === 0);

      if (noTagProjects.length > 0) {
        contentHTML += this.group("未分类", noTagProjects);
      }

      allTags.forEach(tag => {
        const groupProjects = projects.filter(p => p.tags?.includes(tag));
        if (groupProjects.length > 0) {
          contentHTML += this.group(tag, groupProjects);
        }
      });
    } else {
      // 筛选视图
      const filtered = AppState.getFilteredProjects();

      if (filtered.length === 0) {
        contentHTML = `<div style="text-align:center;color:#999;padding:40px;">未找到匹配的项目</div>`;
      } else {
        contentHTML = `<div class="cards-grid">${filtered.map(p => this.card(p)).join("")}</div>`;
      }
    }

    AppState.el.mainContent.innerHTML = contentHTML;
  },

  /**
   * 渲染分组
   */
  group(title, items) {
    return `<section>
      <div class="group-title">${Utils.escapeHtml(title)}</div>
      <div class="cards-grid">${items.map(p => this.card(p)).join("")}</div>
    </section>`;
  },

  /**
   * 渲染单个卡片
   */
  card(proj) {
    const iconHtml = this.icon(proj);
    const editBtn = AppState.unlocked && proj.source !== 'github'
      ? `<button class="card-edit" data-edit-id="${Utils.escapeHtml(proj.id)}">✎</button>`
      : '';

    const desc = Utils.escapeHtml(proj.description || Utils.getDomain(proj.url));
    const safeName = Utils.escapeHtml(proj.name);
    const safeUrl = Utils.isValidUrl(proj.url) ? proj.url : '#';

    // 状态标签
    const statusHtml = proj.status
      ? `<div class="card-status status-${Utils.escapeHtml(proj.status)}">${Utils.escapeHtml(proj.status)}</div>`
      : '';

    // GitHub 来源标签
    const githubBadge = proj.source === 'github'
      ? `<div class="card-github-badge" title="来自 GitHub">🐙</div>`
      : '';

    // Stars 显示
    const starsHtml = proj.stars > 0
      ? `<span class="card-stars">⭐ ${parseInt(proj.stars) || 0}</span>`
      : '';

    // 技术栈标签
    const techItems = [];
    if (proj.language) techItems.push(proj.language);
    if (proj.tech) techItems.push(...proj.tech);

    const techHtml = techItems.length > 0
      ? `<div class="card-tech">${techItems.slice(0, 5).map(t => `<span class="tech-tag">${Utils.escapeHtml(t)}</span>`).join('')}</div>`
      : '';

    return `
      <div class="card" data-url="${Utils.escapeHtml(safeUrl)}">
        ${statusHtml}
        ${githubBadge}
        <div class="card-header">
          ${iconHtml}
          <div class="card-info">
            <div class="card-name">${safeName} ${starsHtml}</div>
            <div class="card-desc">${desc}</div>
          </div>
        </div>
        ${techHtml}
        ${editBtn}
      </div>
    `;
  },

  /**
   * 渲染图标
   */
  icon(proj) {
    // Emoji 图标
    if (proj.icon && !proj.icon.startsWith("http") && proj.icon.length < 8) {
      return `<div class="card-icon-box" style="background:#f0f0f5; font-size:26px;">${Utils.escapeHtml(proj.icon)}</div>`;
    }

    // URL 图标
    if (proj.icon && proj.icon.startsWith("http")) {
      const safeIconUrl = Utils.isValidUrl(proj.icon) ? proj.icon : '';
      return `<div class="card-icon-box" style="background:transparent;"><img src="${Utils.escapeHtml(safeIconUrl)}" class="card-icon-img"></div>`;
    }

    // 默认渐变背景 + 首字母
    const bg = Utils.getGradientByName(proj.name);
    return `<div class="card-icon-box" style="background:${bg};">${Utils.escapeHtml(proj.name?.[0]?.toUpperCase() || '?')}</div>`;
  }
};

// 导出
if (typeof window !== 'undefined') {
  window.Render = Render;
}
