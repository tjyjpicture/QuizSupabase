-- 此脚本用于创建管理员账户
-- 在 Supabase SQL Editor 中运行此脚本

-- 创建一个临时的 admin 用户
-- 密码: admin
-- 注意：在生产环境中请立即修改密码

-- 使用 Supabase 提供的 auth.sign_up 函数
SELECT auth.sign_up(
  email => 'admin@example.com',
  password => 'admin',
  data => '{"username":"admin","role":"admin"}'::jsonb,
  confirm => true
);

-- 等待触发器创建 profile
-- handle_new_user 触发器会自动创建 profile 记录

-- 显示创建结果
SELECT
  'admin@example.com' as "邮箱",
  'admin' as "初始密码",
  '请登录后立即修改密码！' as "重要提示";
