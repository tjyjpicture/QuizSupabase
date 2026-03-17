import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, LayoutDashboard, BookOpen, Users, Settings, Trophy } from "lucide-react";

export async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // 获取用户信息
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, username, role")
    .eq("id", user.id)
    .single();

  const isAdmin = (profile as any)?.role === "admin";

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">答题系统</span>
          </Link>

          {/* 导航链接 */}
          <div className="flex items-center space-x-1">
            {isAdmin ? (
              <>
                <Link href="/admin/questions">
                  <Button variant="ghost">题目管理</Button>
                </Link>
                <Link href="/admin/employees">
                  <Button variant="ghost">员工管理</Button>
                </Link>
                <Link href="/admin/config">
                  <Button variant="ghost">答题配置</Button>
                </Link>
                <Link href="/admin/results">
                  <Button variant="ghost">答题结果</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/quiz">
                  <Button variant="ghost">开始答题</Button>
                </Link>
                <Link href="/quiz/history">
                  <Button variant="ghost">我的记录</Button>
                </Link>
              </>
            )}
          </div>

          {/* 用户菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {(profile as any)?.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {(profile as any)?.username || "未设置"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile/change-password" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>修改密码</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action="/auth/logout" method="POST" className="cursor-pointer w-full">
                  <button type="submit" className="flex items-center w-full text-left">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
