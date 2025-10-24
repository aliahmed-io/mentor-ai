CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  size_bytes INTEGER,
  status TEXT DEFAULT 'uploaded',
  summary_short TEXT,
  summary_long TEXT,
  questions JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  position INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);


-- Mentor AI v2 additions

-- Question type enum (idempotent)
DO $$ BEGIN
  CREATE TYPE question_type AS ENUM ('mcq','short','flashcard');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Single sticky note per user
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  content TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Personal prayers/duas with tags and favorites
CREATE TABLE IF NOT EXISTS prayers (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  language TEXT,
  category TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Quizzes and questions derived from documents or custom
CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  document_id TEXT REFERENCES documents(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id TEXT PRIMARY KEY,
  quiz_id TEXT REFERENCES quizzes(id) ON DELETE CASCADE,
  type question_type NOT NULL,
  prompt TEXT NOT NULL,
  data JSONB,
  source_chunk_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY,
  quiz_id TEXT REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  score INTEGER
);

CREATE TABLE IF NOT EXISTS question_attempts (
  id TEXT PRIMARY KEY,
  attempt_id TEXT REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id TEXT REFERENCES quiz_questions(id) ON DELETE CASCADE,
  answer JSONB,
  correct BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

-- File creations (ppt/docx)
CREATE TABLE IF NOT EXISTS creations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('ppt','docx')),
  title TEXT,
  prompt TEXT,
  document_id TEXT REFERENCES documents(id),
  file_url TEXT,
  status TEXT DEFAULT 'ready',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pomodoro session history
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  label TEXT,
  duration_min INTEGER,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  interruptions INTEGER DEFAULT 0
);

-- Persisted chat messages with citations
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  document_id TEXT REFERENCES documents(id),
  role TEXT CHECK (role IN ('user','assistant')),
  content TEXT,
  source_chunk_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_prayers_user ON prayers(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_user ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id);
