/**
 * GitHub 同步模块
 */
const Github = {
  /**
   * 同步 GitHub 仓库 (自动运行)
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
    }
  }
};

// 全局函数（HTML onclick 调用）
window.closeGithubModal = () => { };

// 导出
if (typeof window !== 'undefined') {
  window.Github = Github;
}
