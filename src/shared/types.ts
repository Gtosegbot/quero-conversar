// User types
export interface User {
  id: number;
  email: string;
  name: string;
  age?: number;
  plan: 'free' | 'premium';
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  id: number;
  user_id: number;
  level: number;
  energy_points: number;
  daily_interactions: number;
  total_interactions: number;
  streak_days: number;
  last_activity_date?: string;
  created_at: string;
  updated_at: string;
}

// Anamnesis types
export interface AnamnesisResponse {
  id: number;
  user_id: number;
  step_number: number;
  question_index: number;
  question: string;
  response: string;
  created_at: string;
  updated_at: string;
}

export interface AnamnesisStep {
  id: number;
  title: string;
  category: string;
  questions: string[];
}

// Chat types
export interface Conversation {
  id: number;
  user_id: number;
  title?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  user_id: number;
  content: string;
  message_type: 'user' | 'bot';
  ai_model?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

// Task types
export interface DailyTask {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: 'mental' | 'physical' | 'spiritual';
  points: number;
  completed: boolean;
  task_date: string;
  created_at: string;
  updated_at: string;
}

// Community types
export interface CommunityRoom {
  id: number;
  name: string;
  description: string;
  category: 'mental' | 'physical' | 'spiritual' | 'general';
  member_count: number;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CommunityMessage {
  id: number;
  room_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

// Professional types
export interface Professional {
  id: number;
  user_id: number;
  specialty: string;
  bio: string;
  hourly_rate: number;
  location?: string;
  experience_years: number;
  is_verified: boolean;
  is_online: boolean;
  languages?: string;
  popularity_score: number;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  message?: string;
  data?: T;
}

export interface DashboardData {
  user_stats: UserStats;
  daily_tasks: DailyTask[];
  plan: 'free' | 'premium';
}

// Form types
export interface RegisterForm {
  email: string;
  name: string;
  age?: number;
}

export interface LoginForm {
  email: string;
}

export interface ChatForm {
  content: string;
  conversation_id?: number;
}

// AI Provider types
export type AIProvider = 'openai' | 'google' | 'anthropic' | 'groq';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  temperature: number;
  max_tokens: number;
}

// Gamification types
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlocked_at?: string;
}

export interface UserProgress {
  level: number;
  current_xp: number;
  xp_to_next_level: number;
  total_xp: number;
  achievements: Achievement[];
  streak_days: number;
  tasks_completed_today: number;
}

// Subscription types
export interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  ai_models: string[];
  monthly_limit?: number;
  popular?: boolean;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Calendar types
export interface Appointment {
  id: string;
  professional_id: number;
  user_id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  meeting_url?: string;
  created_at: string;
  updated_at: string;
}

// Analytics types
export interface UserAnalytics {
  total_conversations: number;
  total_messages: number;
  average_session_time: number;
  most_active_day: string;
  mood_trends: Array<{
    date: string;
    mood_score: number;
  }>;
  topic_interests: Array<{
    topic: string;
    frequency: number;
  }>;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Theme types
export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

// Settings types
export interface UserSettings {
  theme: Theme;
  notifications_enabled: boolean;
  email_notifications: boolean;
  privacy_level: 'public' | 'private' | 'friends';
  preferred_ai_model: AIProvider;
  language: string;
  timezone: string;
}
