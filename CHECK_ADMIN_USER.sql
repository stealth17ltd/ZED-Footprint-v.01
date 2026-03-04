-- Run this in Supabase SQL Editor to check your user setup

-- 1. Check your user's role
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.role,
  u.company_id,
  au.email
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'YOUR_EMAIL_HERE';  -- Replace with your login email

-- 2. If the role is not 'admin', fix it:
-- UPDATE users SET role = 'admin' WHERE id = 'YOUR_USER_ID';

-- 3. Check if you have a company linked:
SELECT 
  u.id as user_id,
  u.first_name,
  u.role,
  u.company_id,
  c.company_name
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.id = 'YOUR_USER_ID';

-- If company_id is NULL, you need to create a company first!
