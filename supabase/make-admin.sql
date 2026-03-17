-- 手动将已注册的用户提升为管理员
-- 在 Supabase SQL Editor 中运行此脚本

-- 将指定用户的角色改为 admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@example.com';
