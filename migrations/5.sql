
-- Add moderation system tables
CREATE TABLE moderators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  specialty TEXT NOT NULL, -- mental_health, fitness, spirituality, general
  level TEXT DEFAULT 'moderator', -- moderator, senior_moderator
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE moderation_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reported_by INTEGER NOT NULL,
  message_id INTEGER,
  user_id INTEGER,
  room_id INTEGER,
  report_type TEXT NOT NULL, -- inappropriate_content, harassment, spam, health_misinformation
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
  assigned_moderator INTEGER,
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE moderator_chat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  moderator_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'alert', -- alert, discussion, resolution
  related_report_id INTEGER,
  room_mention TEXT, -- which room the issue is in
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add app policies table
CREATE TABLE app_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  policy_type TEXT NOT NULL, -- terms_of_service, privacy_policy, community_guidelines, professional_code
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default policies
INSERT INTO app_policies (title, content, policy_type, created_by) VALUES 
('Diretrizes da Comunidade', 
'## Diretrizes da Comunidade - Quero Conversar

### 1. Respeito Mútuo
- Trate todos os membros com gentileza e respeito
- Não toleramos discriminação, harassment ou bullying
- Respeite diferentes perspectivas e experiências

### 2. Confidencialidade
- O que é compartilhado na comunidade permanece na comunidade
- Não compartilhe informações pessoais de outros membros
- Use pseudônimos quando necessário para proteger privacidade

### 3. Conteúdo Apropriado
- Mantenha conversas construtivas e de apoio
- Evite linguagem ofensiva ou inadequada
- Não compartilhe conteúdo que possa ser perturbador

### 4. Orientação Profissional
- Membros podem compartilhar experiências pessoais
- Apenas profissionais verificados podem dar conselhos clínicos
- Em situações de crise, procure ajuda profissional imediata

### 5. Moderação
- Moderadores estão aqui para manter um ambiente seguro
- Reporte conteúdo inadequado aos moderadores
- Decisões de moderação são finais

### Consequências
Violações podem resultar em advertência, suspensão temporária ou banimento permanente.',
'community_guidelines', 1),

('Código de Conduta Profissional',
'## Código de Conduta Profissional

### 1. Ética Profissional
- Mantenha sempre os mais altos padrões éticos
- Respeite a confidencialidade do cliente
- Não estabeleça relacionamentos pessoais com clientes

### 2. Competência
- Pratique apenas dentro de sua área de especialização
- Mantenha-se atualizado com melhores práticas
- Encaminhe clientes quando necessário

### 3. Responsabilidade
- Documente adequadamente todas as sessões
- Esteja disponível para emergências quando necessário
- Reporte situações de risco às autoridades competentes

### 4. Comunicação
- Seja claro sobre custos e políticas
- Mantenha comunicação profissional
- Respeite limites profissionais',
'professional_code', 1);
