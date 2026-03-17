# 员工答题系统

一个基于 Next.js 和 Supabase 的员工知识库答题系统。

## 功能特点

- 🔐 **用户认证**：登录、注册、退出功能
- 👥 **角色管理**：管理员和员工两种角色
- 📝 **题目管理**：管理员可添加、编辑、删除题目
- 🎲 **随机答题**：员工答题时随机抽取题目
- 🚦 **答题控制**：管理员可开启/关闭答题功能
- 📊 **结果统计**：查看所有员工的答题情况
- 🔄 **答题限制**：每人只能答题一次
- 🔑 **密码管理**：用户可修改自己的密码

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | [Next.js 16](https://nextjs.org/) (App Router) |
| 语言 | [TypeScript](https://www.typescriptlang.org/) |
| 样式 | [Tailwind CSS](https://tailwindcss.com/) |
| UI 组件 | [shadcn/ui](https://ui.shadcn.com/) |
| 数据库/认证 | [Supabase](https://supabase.com/) |
| 部署 | [Vercel](https://vercel.com/) |

## 快速开始

### 1. 环境要求

- Node.js 18+
- npm 或 yarn 或 pnpm

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

创建 `.env.local` 文件：

```env
NEXT_PUBLIC_SUPABASE_URL=你的_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_supabase_anon_key
```

### 4. 配置数据库

1. 创建 [Supabase 项目](https://supabase.com)
2. 在 SQL Editor 中运行 `supabase/schema.sql`

3. **创建管理员账户（两种方法）**

   **方法一（推荐）- 通过应用注册：**
   ```bash
   npm run dev
   ```
   - 访问 `/register` 注册：
     - 邮箱：`admin@example.com`
     - 用户名：`admin`
     - 密码：`admin`
   - 运行 `supabase/make-admin.sql` 将该用户提升为管理员

   **方法二 - 通过 Supabase Dashboard：**
   - 在 Supabase Dashboard 的 Authentication 面板手动创建用户
   - 运行 `supabase/make-admin.sql` 提升为管理员

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 6. 默认管理员账号

- 邮箱：`admin@example.com`
- 密码：`admin`

⚠️ **重要**：首次登录后请立即修改密码！

## 部署

详细的部署指南请参阅 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 快速部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/quiz-supabase&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY)

## 项目结构

```
QuizSupabase/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # 管理员页面
│   │   │   ├── questions/      # 题目管理
│   │   │   ├── employees/      # 员工管理
│   │   │   ├── config/         # 答题配置
│   │   │   └── results/        # 答题结果
│   │   ├── quiz/               # 答题页面
│   │   ├── login/              # 登录
│   │   ├── register/           # 注册
│   │   └── profile/            # 个人资料
│   ├── components/             # React 组件
│   │   └── ui/               # shadcn/ui 组件
│   ├── lib/                  # 工具库
│   │   └── supabase/         # Supabase 客户端
│   ├── hooks/                # React Hooks
│   └── types/                # TypeScript 类型
├── supabase/                # Supabase 脚本
├── public/                  # 静态资源
└── package.json
```

## 数据库设计

### 表结构

| 表名 | 说明 |
|------|------|
| `profiles` | 用户资料（username, role, created_at, updated_at） |
| `questions` | 题目（content, options, correct_answer, is_deleted） |
| `quiz_config` | 答题配置（is_enabled, question_count） |
| `quizzes` | 答题记录（user_id, questions, answers, score） |

### RLS 策略

- `profiles`: 用户只能查看/修改自己的资料，管理员可操作所有
- `questions`: 所有人可查看未删除题目，仅管理员可增删改
- `quiz_config`: 所有人可查看，仅管理员可修改
- `quizzes`: 用户只能查看自己的记录，管理员可查看/删除所有

## 开发命令

```bash
npm run dev       # 启动开发服务器
npm run build     # 构建生产版本
npm run start     # 启动生产服务器
npm run lint      # 运行 ESLint
```

## 许可证

MIT License
