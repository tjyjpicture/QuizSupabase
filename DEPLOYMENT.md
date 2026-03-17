# 部署指南

## 部署到 Vercel

### 前置步骤

1. **创建 Supabase 项目**
   - 访问 https://supabase.com 创建账号和项目
   - 获取项目 URL 和 Anon Key（Project Settings > API）

2. **执行数据库脚本**
   - 在 Supabase SQL Editor 中运行 `supabase/schema.sql`

3. **创建管理员账户**
   - **方法一（推荐）**: 通过应用注册
     1. 启动 `npm run dev`
     2. 访问 `/register` 注册：
        - 邮箱：`admin@example.com`
        - 用户名：`admin`
        - 密码：`admin`
     3. 运行 `supabase/make-admin.sql` 将该用户提升为管理员
   - **方法二**: 通过 Supabase Dashboard 的 Authentication 面板手动创建，然后运行 `supabase/make-admin.sql` 提升为管理员

3. **配置环境变量**
   - 在项目根目录创建 `.env.local` 文件：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=你的_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_supabase_anon_key
   ```

### 部署步骤

#### 方法一：使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署
vercel
```

#### 方法二：通过 Vercel Dashboard

1. 将代码推送到 GitHub
2. 登录 [Vercel](https://vercel.com)
3. 点击 "Add New Project"
4. 选择你的 GitHub 仓库
5. 配置项目设置：
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
6. 添加环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`: 你的 Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 你的 Supabase Anon Key
7. 点击 "Deploy"

### 部署后配置

1. **首次登录**
   - 管理员账号：`admin@example.com`
   - 初始密码：`admin`
   - 登录后请立即修改密码！

2. **添加员工**
   - 在"员工管理"页面添加员工账号

3. **添加题目**
   - 在"题目管理"页面添加测试题目

4. **开启答题**
   - 在"答题配置"页面开启答题功能
   - 设置每次答题数量

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

## 技术栈

- **前端框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI 组件**: shadcn/ui
- **数据库/认证**: Supabase
- **部署**: Vercel

## 项目结构

```
src/
├── app/                 # Next.js App Router 页面
│   ├── admin/           # 管理员页面
│   ├── quiz/            # 员工答题页面
│   ├── login/           # 登录页
│   ├── register/        # 注册页
│   └── profile/         # 个人资料
├── components/         # React 组件
│   ├── ui/             # shadcn/ui 组件
│   └── navbar.tsx      # 导航栏
├── lib/              # 工具库
│   ├── supabase/      # Supabase 客户端
│   └── utils.ts       # 通用工具
├── hooks/            # React Hooks
└── types/            # TypeScript 类型定义
```

## 功能清单

### 管理员功能
- [x] 题目管理（添加、编辑、删除）
- [x] 员工管理（添加、删除）
- [x] 答题配置（开启/关闭、设置题目数量）
- [x] 答题结果查看
- [x] 删除员工答题记录

### 员工功能
- [x] 随机答题
- [x] 查看答题历史
- [x] 查看详细答题结果

### 通用功能
- [x] 用户认证（登录、注册、退出）
- [x] 密码修改
- [x] 角色权限控制
- [x] 答题次数限制（每人一次）

## 数据库表结构

| 表名 | 说明 |
|------|------|
| profiles | 用户资料（用户名、角色） |
| questions | 题目表 |
| quiz_config | 答题配置 |
| quizzes | 答题记录 |

## 故障排除

### 问题：无法连接 Supabase
- 检查 `.env.local` 中的 URL 和 Key 是否正确
- 确保在 Supabase Dashboard 中启用了认证功能

### 问题：登录失败
- 确保已运行数据库脚本
- 检查用户是否已创建

### 问题：答题无法提交
- 检查管理员是否开启了答题功能
- 确保用户之前没有提交过答题记录
