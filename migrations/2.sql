
CREATE TABLE appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  professional_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status TEXT DEFAULT 'scheduled',
  amount_paid REAL NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  payment_id TEXT,
  livekit_room_name TEXT,
  meeting_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  professional_id INTEGER,
  appointment_id INTEGER,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  document_type TEXT NOT NULL,
  description TEXT,
  is_prescription BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE video_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  professional_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  video_type TEXT NOT NULL,
  youtube_url TEXT,
  r2_key TEXT,
  thumbnail_url TEXT,
  duration_minutes INTEGER,
  category TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  rating REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  professional_id INTEGER,
  appointment_id INTEGER,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'BRL',
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  professional_share REAL,
  platform_fee REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointments_professional ON appointments(professional_id);
CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_appointment ON documents(appointment_id);
CREATE INDEX idx_video_content_professional ON video_content(professional_id);
CREATE INDEX idx_video_content_category ON video_content(category);
CREATE INDEX idx_payment_transactions_user ON payment_transactions(user_id);
