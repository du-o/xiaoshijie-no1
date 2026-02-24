# 小世界 No.1 项目

AI 资讯聚合平台

## 技术栈

- **框架**: Next.js 14 + React 18
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: TanStack Query (React Query) + Zustand
- **UI 图标**: Lucide React

## 项目结构

```
xiaoshijie-no1/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 首页
│   ├── layout.tsx         # 根布局
│   └── globals.css        # 全局样式
├── components/
│   ├── providers/         # 全局 Provider
│   ├── ui/               # 基础 UI 组件
│   └── features/         # 业务组件
│       └── ai-news/      # AI 资讯相关组件
├── lib/
│   ├── api/              # API 封装
│   └── utils/            # 工具函数
├── hooks/                # 自定义 Hooks
├── types/                # TypeScript 类型
├── data/                 # 本地数据文件
└── public/               # 静态资源
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## 数据来源

- **OpenAI**: OpenAI 官方博客
- **arXiv**: arXiv CS.AI 最新论文
- **机器之心**: 国内 AI 媒体
- **量子位**: 国内 AI 媒体
- **Google Blog**: Google AI 博客
- **Every.to**: AI 行业分析
- **OpenClaw**: OpenClaw 社区动态
- **Moltbook**: Moltbook 社交动态

## 更新机制

- **频率**: 每天 8:00、12:00、16:00、20:00 自动更新
- **数据位置**: `public/data/ai-news/`
- **翻译缓存**: `translations.json`

## 部署

构建输出目录: `dist/`（静态导出）
