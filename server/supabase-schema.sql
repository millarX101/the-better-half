-- Toxic Hottie Database Schema
-- Run this in your Supabase SQL Editor

-- User usage tracking for authenticated users
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  message_count INTEGER DEFAULT 0,
  reset_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 day'),
  is_premium BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  premium_expires_at TIMESTAMPTZ,  -- For one-time yearly purchases
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add premium_expires_at column if table already exists
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;

-- Anonymous user tracking by IP
CREATE TABLE IF NOT EXISTS anonymous_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT UNIQUE NOT NULL,
  message_count INTEGER DEFAULT 0,
  reset_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 day'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation history (optional - for premium users who want to save chats)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  persona TEXT NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_ip ON anonymous_usage(ip_address);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

-- Row Level Security
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policies for user_usage
CREATE POLICY "Users can view own usage" ON user_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all usage" ON user_usage
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for conversations
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_usage_updated_at
  BEFORE UPDATE ON user_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Clean up old anonymous usage records (run as a scheduled job)
-- DELETE FROM anonymous_usage WHERE reset_at < NOW() - INTERVAL '7 days';

-- Training data - stores all Q&A pairs for model improvement
CREATE TABLE IF NOT EXISTS training_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  persona TEXT NOT NULL,
  personality JSONB NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  conversation_depth INTEGER DEFAULT 0, -- Higher = user stayed longer (more engaging)
  flagged BOOLEAN DEFAULT FALSE, -- for bad responses to exclude
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add conversation_depth if table already exists
ALTER TABLE training_data ADD COLUMN IF NOT EXISTS conversation_depth INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_training_data_persona ON training_data(persona);
CREATE INDEX IF NOT EXISTS idx_training_data_depth ON training_data(conversation_depth);
CREATE INDEX IF NOT EXISTS idx_training_data_created ON training_data(created_at);

-- Service role can manage all training data
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage training data" ON training_data
  FOR ALL USING (auth.role() = 'service_role');

-- User streaks and engagement tracking
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  total_sessions INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_roasts_received INTEGER DEFAULT 0,
  achievements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own streaks" ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage streaks" ON user_streaks
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON user_streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
