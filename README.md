# 小世界 No.1 项目

加密货币数据监控面板

## 技术栈

- **框架**: Next.js 14 + React 18
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: TanStack Query (React Query) + Zustand
- **图表**: Recharts（预留）

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
│       └── crypto/       # 加密货币相关
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

- **BTC/ETH 价格**: CoinGecko API
- **AHR999 指数**: 本地 `data/ahr999.json`（由 News 更新）

## 部署

构建输出目录: `dist/`（静态导出）
