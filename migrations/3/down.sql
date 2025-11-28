
DROP TABLE IF EXISTS user_celebrations;
DROP TABLE IF EXISTS user_anamnesis_status;
DROP TABLE IF EXISTS partner_products;
DROP TABLE IF EXISTS partners;
DROP TABLE IF EXISTS super_admins;

-- Remove added columns
ALTER TABLE professionals DROP COLUMN commission_rate;
ALTER TABLE professionals DROP COLUMN is_moderator;
ALTER TABLE users DROP COLUMN user_type;
ALTER TABLE users DROP COLUMN verification_status;
ALTER TABLE daily_tasks DROP COLUMN difficulty;

-- Remove super admin users
DELETE FROM user_stats WHERE user_id IN (SELECT id FROM users WHERE email IN ('gtosegbot@gmail.com', 'admgtoseg@gmail.com', 'disparoseguroback@gmail.com'));
DELETE FROM users WHERE email IN ('gtosegbot@gmail.com', 'admgtoseg@gmail.com', 'disparoseguroback@gmail.com');
