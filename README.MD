# 科技新闻阅读器

## 项目概述

这是一个现代化的科技新闻阅读应用，专注于提供流畅的阅读体验和内容管理功能。应用通过 RSS 源获取最新科技资讯，支持文章阅读、搜索、评论、高亮标记等功能。

## 主要功能

- **新闻聚合**：自动从多个科技媒体源（如虎嗅、36氪等）获取最新资讯
- **文章阅读**：提供清晰舒适的阅读界面
- **内容搜索**：支持全文搜索功能
- **文本高亮**：可以标记重要内容并添加笔记
- **评论系统**：对文章进行评论和讨论
- **响应式设计**：适配各种设备屏幕尺寸

## 技术栈

- **前端框架**：Next.js
- **UI 组件**：自定义组件 + Tailwind CSS
- **数据库**：Vercel Postgres
- **部署**：Vercel

## 开发环境设置

### 前提条件

- Node.js 18+ 
- npm 或 yarn
- Vercel 账户（用于数据库）

### 安装步骤

1. 克隆仓库
   ```bash
   git clone <仓库地址>
   cd <项目文件夹>
   ```

2. 安装依赖
   ```bash
   npm install
   # 或
   yarn
   ```

3. 环境变量配置
   创建 `.env.local` 文件并添加以下变量：
   ```
   POSTGRES_URL=<你的Vercel Postgres连接URL>
   CRON_API_KEY=<用于定时任务的API密钥>
   NEXT_PUBLIC_CRON_API_KEY=<客户端可用的API密钥>
   ```

4. 启动开发服务器
   ```bash
   npm run dev
   # 或
   yarn dev
   ```

## 项目结构

```
/app                  - Next.js 应用路由和页面
  /api                - API 路由
  /article            - 文章详情页
  /my-highlights      - 用户高亮内容页
  /my-comments        - 用户评论页
/components           - React 组件
/lib                  - 工具函数和业务逻辑
  /db.ts              - 数据库操作
  /rss-fetcher.ts     - RSS 获取逻辑
  /logger.ts          - 日志系统
  /types.ts           - TypeScript 类型定义
/types                - 全局类型声明
/public               - 静态资源
```

## 数据库结构

应用使用 Vercel Postgres 数据库，包含以下表：

- **articles** - 存储文章内容
- **highlights** - 用户的文本高亮
- **comments** - 用户评论
- **cache** - 缓存数据

## RSS 源配置

RSS 源在 `lib/rss-fetcher.ts` 中配置，当前支持：

- 虎嗅网
- 36氪

可以通过修改 `RSS_SOURCES` 数组添加更多源。

## 部署

项目可以直接部署到 Vercel：

```bash
vercel
```

## 开发指南

### 添加新的 RSS 源

1. 在 `lib/rss-fetcher.ts` 中的 `RSS_SOURCES` 数组添加新源：
   ```typescript
   {
     url: "https://example.com/rss",
     fallbackUrl: "https://alternate-source.com/rss",
     name: "示例源",
     alternateUrls: ["https://backup1.com/rss", "https://backup2.com/rss"]
   }
   ```

### 自定义 UI 样式

项目使用 Tailwind CSS 进行样式设计，主要样式定义在：
- `app/globals.css` - 全局样式和自定义组件样式
- 各组件文件中的内联 Tailwind 类

## 日志系统

项目包含一个全面的日志系统，可在开发环境中使用 Alt+L 打开日志查看器。

## 许可证

[MIT License](LICENSE)
