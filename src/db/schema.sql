-- Enable PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  avatar_url TEXT,
  bio TEXT
);

-- Memes Table
CREATE TABLE IF NOT EXISTS memes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  image_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('active', 'removed')) DEFAULT 'active'
);

-- Interactions Table
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meme_id UUID NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'share', 'save')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, meme_id, type)
);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meme_id UUID NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewed', 'actioned')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_memes_creator ON memes(creator_id);
CREATE INDEX IF NOT EXISTS idx_memes_status ON memes(status);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_meme ON interactions(meme_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(type);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_meme ON reports(meme_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Row Level Security (RLS) Policies

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users Policies
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Memes Policies
CREATE POLICY "Anyone can view active memes"
  ON memes FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can create memes"
  ON memes FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own memes"
  ON memes FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Only administrators can delete memes"
  ON memes FOR DELETE
  USING (auth.uid() IN (
    SELECT id FROM users WHERE email IN (
      -- Add admin emails here
      'admin@example.com'
    )
  ));

-- Interactions Policies
CREATE POLICY "Users can create their own interactions"
  ON interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own interactions"
  ON interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Meme creators can view interactions on their memes"
  ON interactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM memes
    WHERE memes.id = meme_id
    AND memes.creator_id = auth.uid()
  ));

CREATE POLICY "Users can update their own interactions"
  ON interactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions"
  ON interactions FOR DELETE
  USING (auth.uid() = user_id);

-- Reports Policies
CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Only administrators can view reports"
  ON reports FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE email IN (
      -- Add admin emails here
      'admin@example.com'
    )
  ));

CREATE POLICY "Reporters can view their own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Only administrators can update report status"
  ON reports FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM users WHERE email IN (
      -- Add admin emails here
      'admin@example.com'
    )
  ));

-- Create storage buckets
-- Note: This is typically done through the Supabase UI or with the Supabase CLI
-- CREATE BUCKET memes;

-- COMMENT ON TABLE users IS 'Stores user profile information';
-- COMMENT ON TABLE memes IS 'Stores meme content and metadata';
-- COMMENT ON TABLE interactions IS 'Stores user interactions with memes (likes, shares, saves)';
-- COMMENT ON TABLE reports IS 'Stores user reports of inappropriate memes'; 