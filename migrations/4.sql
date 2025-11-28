
CREATE TABLE task_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  difficulty TEXT DEFAULT 'easy',
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL,
  page_section TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  start_date DATE,
  end_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE professional_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  professional_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  accepts_emergency BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO task_templates (title, description, category, points, difficulty, created_by) VALUES
('Pratique 5 minutos de respiração profunda', 'Reserve um momento para se conectar consigo mesmo', 'mental', 30, 'easy', 1),
('Escreva 3 coisas pelas quais você é grato', 'Cultive a gratidão em seu dia a dia', 'spiritual', 40, 'easy', 1),
('Faça uma caminhada de 10 minutos', 'Cuide do seu corpo e mente ao ar livre', 'physical', 50, 'easy', 1),
('Envie uma mensagem carinhosa para alguém', 'Fortaleça seus relacionamentos', 'mental', 35, 'easy', 1),
('Leia algo que te faça rir por 10 minutos', 'O riso é o melhor remédio para a alma', 'mental', 30, 'easy', 1),
('Diga a alguém o quanto essa pessoa é importante', 'Expressar gratidão fortalece laços e eleva o espírito', 'spiritual', 60, 'easy', 1),
('Acorde amanhã cedo e dê bom dia para as pessoas', 'Um simples cumprimento pode transformar o dia de alguém', 'mental', 50, 'easy', 1),
('Faça 15 minutos de exercício ou caminhada', 'Cuide do seu corpo, ele é o templo da sua alma', 'physical', 40, 'easy', 1),

('Medite por 15 minutos', 'Aprofunde sua prática de mindfulness', 'spiritual', 60, 'medium', 1),
('Faça 30 minutos de exercício', 'Desafie seus limites físicos', 'physical', 80, 'medium', 1),
('Leia um capítulo de um livro de crescimento pessoal', 'Invista em seu desenvolvimento', 'mental', 70, 'medium', 1),
('Ajude alguém sem esperar nada em troca', 'Pratique a generosidade genuína', 'spiritual', 90, 'medium', 1),
('Pratique um hobby por 30 minutos', 'Desenvolva suas habilidades criativas', 'mental', 65, 'medium', 1),
('Prepare uma refeição saudável', 'Cuide da sua nutrição com carinho', 'physical', 75, 'medium', 1),
('Telefone para um amigo que não vê há tempo', 'Reconecte-se com pessoas importantes', 'mental', 55, 'medium', 1),
('Organize um espaço da sua casa', 'Um ambiente organizado traz paz mental', 'mental', 60, 'medium', 1),

('Mantenha um jejum intermitente de 16 horas', 'Desafie sua disciplina e saúde', 'physical', 120, 'hard', 1),
('Complete um projeto que você vem adiando', 'Supere a procrastinação', 'mental', 150, 'hard', 1),
('Tenha uma conversa difícil que você vem evitando', 'Desenvolva coragem emocional', 'mental', 100, 'hard', 1),
('Pratique uma nova habilidade por 1 hora', 'Saia da zona de conforto', 'mental', 110, 'hard', 1),
('Faça 1 hora de exercício intenso', 'Supere seus limites físicos', 'physical', 140, 'hard', 1),
('Escreva uma carta de perdão (para você ou alguém)', 'Liberte-se de mágoas e ressentimentos', 'spiritual', 130, 'hard', 1),
('Dedique 2 horas a um projeto pessoal importante', 'Invista no seu futuro e sonhos', 'mental', 120, 'hard', 1),
('Pratique uma boa ação anônima', 'Cultive a compaixão desinteressada', 'spiritual', 110, 'hard', 1);
