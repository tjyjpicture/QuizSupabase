import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password, username } = await req.json();

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

    // 使用 service role 创建用户，跳过邮箱验证
    const adminClient = createAdminClient();
    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username },
      });

    if (createError) {
      console.error("Admin create user error:", createError);
      return NextResponse.json(
        { error: `创建用户失败: ${createError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, userId: newUser.user.id });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
