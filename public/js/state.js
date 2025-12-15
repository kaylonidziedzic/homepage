/**
 * 应用状态管理模块
 */
const AppState = {
  // 存储键
  STORAGE_KEYS: {
    favorites: "nav-favorites",
    data: "nav-data",
    password: "nav-password",
    theme: "nav-theme"
  },

  // 数据状态
  profile: {},
  projects: [],
  githubConfig: {},

  // UI 状态
  unlocked: false, // 实际上不再使用，但保留以防万一有残留引用
  editingId: null,

  // 筛选状态
  filter: {
    search: "",
    tag: "",
    favoritesOnly: false,
    favorites: new Set()
  },

  // DOM 元素引用（延迟初始化）
  el: null,

  /**
   * 初始化 DOM 元素引用
   */
  initElements() {
    this.el = {
      // 时钟
      clock: document.getElementById("clock"),
      date: document.getElementById("date"),

      // 主内容区
      mainContent: document.getElementById("mainContent"),
      search: document.getElementById("searchInput"),
      tagChips: document.getElementById("tagChips"),

      // 个人信息区
      profileSection: document.getElementById("profileSection"),
      profileAvatar: document.getElementById("profileAvatar"),
      profileName: document.getElementById("profileName"),
      profileBio: document.getElementById("profileBio"),
      profileLocation: document.getElementById("profileLocation"),
      socialLinks: document.getElementById("socialLinks"),

      // Dock 按钮
      btnTheme: document.getElementById("btnTheme")
    };
  },

  /**
   * 加载数据到状态
   */
  loadData(data) {
    if (!data) return;
    this.profile = data.profile || {};
    this.githubConfig = data.githubConfig || {};
    this.projects = data.projects || data.services || [];
  },

  /**
   * 获取当前数据快照（用于保存）
   */
  getDataSnapshot() {
    return {
      profile: this.profile,
      githubConfig: this.githubConfig,
      projects: this.projects
    };
  },

  /**
   * 设置解锁状态 (不再使用，空实现)
   */
  setUnlocked(value) {
    // Read-only mode: do nothing
  },

  /**
   * 设置搜索关键词
   */
  setSearch(value) {
    this.filter.search = value.toLowerCase();
  },

  /**
   * 设置当前标签筛选
   */
  setTag(value) {
    this.filter.tag = value;
  },

  /**
   * 获取所有标签
   */
  getAllTags() {
    const tags = new Set();
    this.projects.forEach(p => p.tags?.forEach(t => tags.add(t)));
    return tags;
  },

  /**
   * 获取筛选后的项目列表
   */
  getFilteredProjects() {
    return this.projects.filter(p => {
      const matchText = (p.name + p.url + (p.tags?.join("") || ""))
        .toLowerCase()
        .includes(this.filter.search);
      const matchTag = !this.filter.tag || p.tags?.includes(this.filter.tag);
      return matchText && matchTag;
    });
  },

  /**
   * 添加项目
   */
  addProject(project) {
    project.id = project.id || `proj-${Date.now()}`;
    project.source = project.source || 'manual';
    this.projects.push(project);
  },

  /**
   * 更新项目
   */
  updateProject(id, data) {
    this.projects = this.projects.map(p => p.id === id ? { ...p, ...data } : p);
  },

  /**
   * 删除项目
   */
  deleteProject(id) {
    this.projects = this.projects.filter(p => p.id !== id);
  },

  /**
   * 根据 ID 查找项目
   */
  findProject(id) {
    return this.projects.find(p => p.id === id);
  },

  /**
   * 清除 GitHub 来源的项目
   */
  clearGithubProjects() {
    this.projects = this.projects.filter(p => p.source !== 'github');
  },

  /**
   * 添加 GitHub 项目
   */
  addGithubProjects(repos) {
    const githubProjects = repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      url: repo.url,
      homepage: repo.homepage,
      icon: '📦',
      stars: repo.stars,
      language: repo.language,
      tech: repo.topics,
      tags: repo.topics?.length > 0 ? repo.topics : ['GitHub'],
      lastUpdate: repo.lastUpdate,
      source: 'github'
    }));
    this.projects = [...this.projects, ...githubProjects];
    return githubProjects.length;
  }
};

// 导出（兼容非模块化环境）
if (typeof window !== 'undefined') {
  window.AppState = AppState;
}
