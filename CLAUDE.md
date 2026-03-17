# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an employee quiz system built with Next.js 16 (App Router) and Supabase. It features role-based access control with admin and employee roles, where admins can manage questions, employees, and quiz settings, while employees can take randomized quizzes.

## Key Commands

```bash
# Development
npm run dev              # Start development server on http://localhost:3000

# Build
npm run build            # Build for production
npm run start            # Start production server

# Linting
npm run lint             # Run ESLint
```

## Architecture

### Tech Stack
- **Frontend Framework**: Next.js 16 with App Router and TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database/Auth**: Supabase (PostgreSQL with built-in auth)
- **Deployment**: Vercel

### Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (admin)/            # Admin routes (questions, employees, config, results)
│   ├── (employee)/         # Employee routes (quiz, history)
│   ├── (auth)/             # Auth routes (login, register)
│   ├── profile/             # User profile routes
│   ├── layout.tsx           # Root layout with Navbar and Toaster
│   └── page.tsx            # Home page (role-based dashboard)
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── navbar.tsx           # Main navigation (server component)
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Browser Supabase client for client components
│   │   └── server.ts        # Server Supabase client for server components
│   └── utils.ts             # Utility functions (cn for className merging)
├── hooks/
│   └── use-toast.ts         # Toast notification hook
├── middleware.ts            # Auth middleware - protects routes
└── types/
    └── database.ts          # Supabase database type definitions
```

### Database Schema (Supabase)

**Tables:**
- `profiles`: User profiles with username and role (admin/employee)
- `questions`: Quiz questions with content, options (JSONB), and correct answer
- `quiz_config`: Quiz settings (enabled status, question count)
- `quizzes`: Quiz submissions with questions, answers, and score

**Key RLS Policies:**
- Users can only read/update their own profile; admins can manage all
- All users can read non-deleted questions; only admins can create/edit/delete
- All users can read quiz_config; only admins can update
- Employees can only read their own quiz results; admins can read all and delete

### Authentication Flow

The middleware (`src/middleware.ts`) handles route protection:
- Public routes: `/login`, `/register`
- Protected routes: All others (require authentication)
- Authenticated users are redirected from public routes
- Unauthenticated users are redirected to login from protected routes

## Important Patterns

### Supabase Client Usage

**For client components:**
```typescript
import { createBrowserClient } from "@supabase/ssr";
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**For server components:**
```typescript
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();
```

### Role-Based Access

Users have a `role` in the `profiles` table (values: 'admin' | 'employee'). Check this to conditionally render admin/employee features:
```typescript
const isAdmin = profile?.role === 'admin';
```

### Admin Default Credentials
- Email: `admin@example.com`
- Password: `admin`
- Create this account by running `supabase/create-admin.sql` in Supabase SQL Editor

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/middleware.ts` | Route protection and auth redirects |
| `src/lib/supabase/client.ts` | Browser Supabase client factory |
| `src/lib/supabase/server.ts` | Server Supabase client factory |
| `src/types/database.ts` | Generated TypeScript types from Supabase |
| `src/components/navbar.tsx` | Main navigation with role-based links |
| `src/hooks/use-toast.ts` | Toast notification system |
| `supabase/schema.sql` | Database table creation script |
| `supabase/create-admin.sql` | Admin account creation script |
| `.env.local.example` | Environment variable template |

## Environment Setup

Required environment variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these from Supabase Dashboard > Project Settings > API.

## Database Initialization

1. Create Supabase project at https://supabase.com
2. Run `supabase/schema.sql` in Supabase SQL Editor to create tables and RLS policies
3. Run `supabase/create-admin.sql` to create the default admin account

## Quiz System Logic

- **Quiz Enablement**: Controlled by `quiz_config.is_enabled` - employees can only quiz when enabled
- **One-Time Quiz**: The `quizzes` table has a unique constraint on `user_id` - each user can only submit once
- **Random Questions**: Questions are randomly selected from available questions when a quiz starts
- **Answer Validation**: Correct answers are stored in `questions.correct_answer` and compared against user submissions

## Known Issues

### Type Inference with Supabase
When selecting from tables that don't return explicit types, you may need type assertions:
```typescript
const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
const isAdmin = (profile as any)?.role === "admin";
```

### Middleware Warning
Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts`. The current implementation uses `middleware.ts` which works but shows a deprecation warning.

## Deployment

The project is configured for Vercel deployment. See `DEPLOYMENT.md` for detailed deployment instructions.

## Default Admin Account

After running the database scripts, log in with:
- Email: `admin@example.com`
- Password: `admin`

**Important**: Change this password immediately after first login!
