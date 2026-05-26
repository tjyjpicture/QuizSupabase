import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 鉴权：确保当前用户是管理员
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if ((profile as any)?.role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    // 不允许删除管理员
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", id)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    if ((targetProfile as any).role === "admin") {
      return NextResponse.json({ error: "不能删除管理员" }, { status: 403 });
    }

    // 使用 service role 删除 auth 用户
    const adminClient = createAdminClient();
    const { error: authError } = await adminClient.auth.admin.deleteUser(id);

    if (authError) {
      console.error("Auth delete error:", authError);
      return NextResponse.json(
        { error: `删除认证用户失败: ${authError.message}` },
        { status: 500 }
      );
    }

    // profiles 和 quizzes 会通过 ON DELETE CASCADE 自动删除
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
