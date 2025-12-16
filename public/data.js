// 默认数据结构
window.defaultData = {
  // 隐私暗号
  secretCode: "hello",

  // 个人信息
  profile: {
    name: "你的名字",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Demo",
    bio: "全栈开发者 | 开源爱好者",
    location: "中国",
    socials: [
      { name: "GitHub", icon: "🐙", url: "https://github.com" },
      { name: "Email", icon: "📧", url: "mailto:example@email.com" }
    ]
  },

  // GitHub 配置
  githubConfig: {
    enabled: false,
    username: "",
    syncRepos: false,
    excludeForked: true,
    excludePrivate: false
  },

  // 项目列表
  projects: [
    {
      id: "demo-1",
      name: "Google",
      description: "全球最大的搜索引擎",
      url: "https://www.google.com",
      icon: "🔍",
      tags: ["搜索", "工具"],
      source: "manual"
    },
    {
      id: "demo-2",
      name: "GitHub",
      description: "全球最大的代码托管平台",
      url: "https://github.com",
      icon: "🐙",
      tags: ["开发", "工具"],
      source: "manual"
    },
    {
      id: "demo-private",
      name: "私密链接示例",
      description: "在搜索框输入暗号 'hello' 可解锁",
      url: "https://example.com",
      icon: "🔒",
      tags: ["私密"],
      source: "manual",
      private: true
    }
  ]
};

// 兼容旧版本
window.defaultServices = window.defaultData.projects;
