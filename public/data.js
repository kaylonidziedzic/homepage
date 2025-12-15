// 默认数据结构
window.defaultData = {
  // 个人信息
  profile: {
    name: "Nax",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nax",
    bio: "Full-Stack Developer | Open Source Enthusiast",
    location: "China",
    socials: [
      { name: "GitHub", icon: "🐙", url: "https://github.com/yourusername" },
      { name: "Blog", icon: "✍️", url: "https://yourblog.com" },
      { name: "Email", icon: "📧", url: "mailto:your@email.com" },
      { name: "Twitter", icon: "🐦", url: "https://twitter.com/yourusername" }
    ]
  },

  // GitHub 配置
  githubConfig: {
    enabled: false,
    username: "",
    token: "",  // 可选，用于提高 API 限额
    syncRepos: true,  // 是否同步仓库
    excludeForked: true,  // 排除 fork 的仓库
    excludePrivate: false  // 排除私有仓库
  },

  // 项目列表
  projects: [
    {
      id: "proj-1",
      name: "个人主页项目",
      description: "一个现代化的个人主页，展示我的项目和技能",
      url: "https://github.com/yourusername/homepage",
      icon: "🏠",
      status: "进行中",
      tech: ["HTML", "CSS", "JavaScript", "Node.js"],
      tags: ["前端", "后端"],
      stars: 0,
      lastUpdate: "2025-12-12",
      source: "manual"  // manual: 手动添加, github: GitHub 同步
    },
    {
      id: "proj-2",
      name: "Prometheus 监控",
      description: "生产环境监控数据采集系统",
      url: "https://atlas-01.internal:9090",
      icon: "📊",
      status: "运行中",
      tech: ["Prometheus", "Grafana", "Docker"],
      tags: ["监控", "运维"],
      server: "atlas-01",
      source: "manual"
    },
    {
      id: "proj-3",
      name: "GitLab 代码托管",
      description: "团队代码托管与 CI/CD 平台",
      url: "https://gitlab.dev.example.com",
      icon: "🦊",
      status: "运行中",
      tech: ["GitLab", "CI/CD", "Docker"],
      tags: ["开发", "CI"],
      server: "hera-dev",
      source: "manual"
    }
    ,
    {
      id: "proj-4",
      name: "Docker 管理",
      description: "Portainer 容器管理面板",
      url: "https://portainer.local:9000",
      icon: "🐳",
      status: "运行中",
      tech: ["Docker", "Go"],
      tags: ["运维", "工具"],
      source: "manual"
    },
    {
      id: "proj-5",
      name: "家庭影院",
      description: "Jellyfin 媒体服务器，存储电影和剧集",
      url: "https://jellyfin.local:8096",
      icon: "🎬",
      status: "已完成",
      tech: ["C#", ".NET"],
      tags: ["娱乐", "自托管"],
      source: "manual"
    },
    {
      id: "proj-6",
      name: "文件同步",
      description: "Syncthing 跨设备文件同步工具",
      url: "https://syncthing.local:8384",
      icon: "🔄",
      status: "维护中",
      tech: ["Go", "P2P"],
      tags: ["工具", "存储"],
      source: "manual"
    },
    {
      id: "proj-7",
      name: "密码管理",
      description: "Vaultwarden 密码管理器自托管实例",
      url: "https://vault.local",
      icon: "🔒",
      status: "运行中",
      tech: ["Rust", "Security"],
      tags: ["安全", "工具"],
      source: "manual"
    },
    {
      id: "proj-8",
      name: "智能家居",
      description: "Home Assistant 智能家居控制中心",
      url: "https://hass.local:8123",
      icon: "🏠",
      status: "进行中",
      tech: ["Python", "IoT"],
      tags: ["IoT", "生活"],
      source: "manual"
    }
  ]
};

// 兼容旧版本（如果有人还在用 defaultServices）
window.defaultServices = window.defaultData.projects;
