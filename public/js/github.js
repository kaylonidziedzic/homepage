/**
 * GitHub 同步模块
 */
const Github = {
  /**
   * 打开配置模态框
   */
  openModal() {
    const { el, githubConfig } = AppState;

    el.githubModal.hidden = false;
    el.githubModal.removeAttribute('hidden');

    // 填充当前配置
    el.githubEnabled.checked = githubConfig.enabled || false;
    el.githubUsername.value = githubConfig.username || '';
    el.githubToken.value = githubConfig.token || '';
    el.excludeForked.checked = githubConfig.excludeForked !== false;
    el.excludePrivate.checked = githubConfig.excludePrivate || false;
  },

  /**
   * 关闭配置模态框
   */
  closeModal() {
    const { el } = AppState;
    el.githubModal.hidden = true;
    el.githubModal.setAttribute('hidden', '');
  },

  /**
   * 测试连接
   */
  async testConnection() {
    const username = AppState.el.githubUsername.value.trim();

    if (!username) {
      alert("请先填写 GitHub 用户名");
      return;
    }

    try {
      const repos = await Api.fetchGithubRepos(username);
      alert(`✅ 连接成功！找到 ${repos.length} 个仓库`);
    } catch (error) {
      alert(`❌ 连接失败: ${error.message}`);
    }
  },

  /**
   * 保存配置并同步
   */
  async saveConfig() {
    const { el } = AppState;

    AppState.githubConfig = {
      enabled: el.githubEnabled.checked,
      username: el.githubUsername.value.trim(),
      token: el.githubToken.value.trim(),
      syncRepos: true,
      excludeForked: el.excludeForked.checked,
      excludePrivate: el.excludePrivate.checked
    };

    if (AppState.githubConfig.enabled && !AppState.githubConfig.username) {
      alert("请填写 GitHub 用户名");
      return;
    }

    this.closeModal();

    if (AppState.githubConfig.enabled && AppState.githubConfig.username) {
      await this.sync();
    } else {
      // 禁用同步时删除 GitHub 项目
      AppState.clearGithubProjects();
    }

    await Api.saveData();
    Render.main();
  },

  /**
   * 同步 GitHub 仓库
   */
  async sync() {
    const { githubConfig } = AppState;
    if (!githubConfig.username) return;

    try {
      let repos = await Api.fetchGithubRepos(githubConfig.username);

      // 过滤
      if (githubConfig.excludeForked) {
        repos = repos.filter(r => !r.isFork);
      }
      if (githubConfig.excludePrivate) {
        repos = repos.filter(r => !r.isPrivate);
      }

      // 更新项目
      AppState.clearGithubProjects();
      const count = AppState.addGithubProjects(repos);

      console.log(`✅ 已同步 ${count} 个 GitHub 仓库`);
      Render.main();
    } catch (error) {
      console.error('GitHub 同步失败:', error);
      alert(`❌ GitHub 同步失败: ${error.message}`);
    }
  }
};

// 全局函数（HTML onclick 调用）
window.closeGithubModal = () => Github.closeModal();

// 导出
if (typeof window !== 'undefined') {
  window.Github = Github;
}
