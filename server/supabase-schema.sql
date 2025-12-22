-- Toxic Hottie Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- PROFILES TABLE - Main user data
-- ============================================
-- This table stores user profile info and auto-creates when users sign up

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  partner_gender TEXT DEFAULT 'partner', -- wife, husband, partner
  user_gender TEXT DEFAULT 'other', -- male, female, other
  partner_name TEXT, -- custom name for their AI partner
  is_premium BOOLEAN DEFAULT FALSE,
  premium_plan TEXT, -- 'monthly' or 'annual'
  premium_started_at TIMESTAMPTZ,
  premium_expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  total_messages INTEGER DEFAULT 0,
  signup_source TEXT, -- where they came from (organic, referral, ad)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for quick email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_premium ON profiles(is_premium);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON profiles
  FOR ALL USING (auth.role() = 'service_role');

-- AUTO-CREATE PROFILE ON SIGNUP
-- This function runs automatically when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists (for re-running)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- USER USAGE TABLE - Daily message tracking
-- ============================================
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
  is_premium BOOLEAN DEFAULT FALSE, -- Was this a premium/Full Send conversation
  rating INTEGER DEFAULT 0, -- Manual rating: -1 bad, 0 neutral, 1 good, 2 excellent
  flagged BOOLEAN DEFAULT FALSE, -- for bad responses to exclude
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if table already exists
ALTER TABLE training_data ADD COLUMN IF NOT EXISTS conversation_depth INTEGER DEFAULT 0;
ALTER TABLE training_data ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE training_data ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 0;

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
