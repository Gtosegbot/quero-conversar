
-- Add super admin system
CREATE TABLE super_admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  level TEXT NOT NULL DEFAULT 'admin', -- admin, super_admin, moderator
  permissions TEXT, -- JSON string of permissions
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add partners table
CREATE TABLE partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  contact_info TEXT,
  commission_rate REAL DEFAULT 0.70, -- 70% for partners
  is_verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add products table for partners
CREATE TABLE partner_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price REAL NOT NULL,
  product_type TEXT NOT NULL, -- ebook, course, service, product
  file_url TEXT, -- for digital products
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add commission rates to professionals
ALTER TABLE professionals ADD COLUMN commission_rate REAL DEFAULT 0.80;
ALTER TABLE professionals ADD COLUMN is_moderator BOOLEAN DEFAULT FALSE;

-- Add user roles
ALTER TABLE users ADD COLUMN user_type TEXT DEFAULT 'user'; -- user, professional, partner, admin
ALTER TABLE users ADD COLUMN verification_status TEXT DEFAULT 'none'; -- none, pending, verified

-- Add difficulty to daily tasks
ALTER TABLE daily_tasks ADD COLUMN difficulty TEXT DEFAULT 'easy'; -- easy, medium, hard

-- Add anamnesis completion tracking
CREATE TABLE user_anamnesis_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert super admins (use INSERT OR IGNORE to avoid conflicts)
INSERT OR IGNORE INTO users (email, name, user_type, verification_status) VALUES 
('gtosegbot@gmail.com', 'Super Admin 1', 'admin', 'verified'),
('admgtoseg@gmail.com', 'Super Admin 2', 'admin', 'verified'),
('disparoseguroback@gmail.com', 'Super Admin 3', 'admin', 'verified');

-- Update existing users to admin if they exist
UPDATE users SET user_type = 'admin', verification_status = 'verified' 
WHERE email IN ('gtosegbot@gmail.com', 'admgtoseg@gmail.com', 'disparoseguroback@gmail.com');

INSERT OR IGNORE INTO super_admins (user_id, level, permissions) 
SELECT id, 'super_admin', '["all"]' FROM users WHERE email IN ('gtosegbot@gmail.com', 'admgtoseg@gmail.com', 'disparoseguroback@gmail.com');

-- Initialize user stats for super admins (use INSERT OR IGNORE)
INSERT OR IGNORE INTO user_stats (user_id) 
SELECT id FROM users WHERE email IN ('gtosegbot@gmail.com', 'admgtoseg@gmail.com', 'disparoseguroback@gmail.com');

-- Add celebration system
CREATE TABLE user_celebrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  celebration_type TEXT NOT NULL, -- task_complete, level_up, streak_milestone
  message TEXT NOT NULL,
  shown BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
