import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Settings, Trophy, PlayCircle, History } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 获取用户角色
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, username")
    .eq("id", user.id)
    .single();

  const isAdmin = (profile as any)?.role === "admin";

  // Debug 信息
  console.log("=== DEBUG INFO ===");
  console.log("User ID:", user.id);
  console.log("User Email:", user.email);
  console.log("Profile:", JSON.stringify(profile, null, 2));
  console.log("Profile Error:", profileError);
  console.log("Is Admin:", isAdmin);
  console.log("=================");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            员工知识考察系统
          </h1>
          <p className="text-gray-600">
            欢迎回来，{(profile as any)?.username || user.email}
          </p>
        </div>

        {isAdmin ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <CardTitle>题目管理</CardTitle>
                <CardDescription>
                  添加、编辑和删除题目
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/questions">
                  <Button className="w-full">进入管理</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>员工管理</CardTitle>
                <CardDescription>
                  添加和删除员工账号
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/employees">
                  <Button className="w-full">进入管理</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Settings className="h-8 w-8 text-primary mb-2" />
                <CardTitle>答题配置</CardTitle>
                <CardDescription>
                  开启答题和设置题目数量
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/config">
                  <Button className="w-full">进入配置</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Trophy className="h-8 w-8 text-primary mb-2" />
                <CardTitle>答题结果</CardTitle>
                <CardDescription>
                  查看所有员工的答题情况
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/results">
                  <Button className="w-full">查看结果</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <PlayCircle className="h-8 w-8 text-primary mb-2" />
                <CardTitle>开始答题</CardTitle>
                <CardDescription>
                  进行知识测试
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/quiz">
                  <Button className="w-full" size="lg">
                    开始答题
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <History className="h-8 w-8 text-primary mb-2" />
                <CardTitle>我的记录</CardTitle>
                <CardDescription>
                  查看历史答题记录
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/quiz/history">
                  <Button className="w-full" size="lg" variant="outline">
                    查看记录
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
