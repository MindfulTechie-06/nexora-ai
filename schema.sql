-- ====================================================================
-- Nexora AI — PostgreSQL Database Schema for InsForge BaaS
-- Tables: profiles, conversations, conversation_members, messages
-- Row-Level Security (RLS) policies and performance indexes
-- ====================================================================

-- 1. Profiles Table
-- Stores user public info linked to InsForge Auth User ID
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Conversations Table
-- Represents 1-on-1 direct conversations or group chats
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Conversation Members Table
-- Links conversations to participant user IDs
CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- 4. Messages Table
-- Stores conversation messages with sender references
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(trim(content)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- Performance Indexes
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_conversation_members_user_id ON public.conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_conv_id ON public.conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- ====================================================================
-- Enable Row Level Security (RLS)
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- Security Definer Helper Functions (Prevents RLS Recursion)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.is_conversation_member(p_conversation_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_conversation_member(p_conversation_id UUID, p_user_id UUID, p_current_user UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT (
    p_user_id = p_current_user
    OR EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = p_conversation_id AND created_by = p_current_user
    )
    OR EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = p_conversation_id AND user_id = p_current_user
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_insert_conversation_member(p_conversation_id UUID, p_user_id UUID, p_current_user UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT (
    p_user_id = p_current_user
    OR EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = p_conversation_id AND created_by = p_current_user
    )
    OR EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = p_conversation_id AND user_id = p_current_user
    )
  );
$$;

-- ====================================================================
-- Row Level Security (RLS) Policies
-- ====================================================================

-- --- PROFILES ---
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- --- CONVERSATIONS ---
DROP POLICY IF EXISTS "Users can view conversations they belong to" ON public.conversations;
CREATE POLICY "Users can view conversations they belong to"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR public.is_conversation_member(id, auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update conversations they belong to" ON public.conversations;
CREATE POLICY "Users can update conversations they belong to"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR public.is_conversation_member(id, auth.uid()));

-- --- CONVERSATION MEMBERS ---
DROP POLICY IF EXISTS "Users can view members of their conversations" ON public.conversation_members;
CREATE POLICY "Users can view members of their conversations"
  ON public.conversation_members FOR SELECT
  TO authenticated
  USING (public.can_view_conversation_member(conversation_id, user_id, auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert conversation members" ON public.conversation_members;
CREATE POLICY "Authenticated users can insert conversation members"
  ON public.conversation_members FOR INSERT
  TO authenticated
  WITH CHECK (public.can_insert_conversation_member(conversation_id, user_id, auth.uid()));

-- --- MESSAGES ---
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
CREATE POLICY "Users can view messages from their conversations"
  ON public.messages FOR SELECT
  TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Users can insert messages into their conversations" ON public.messages;
CREATE POLICY "Users can insert messages into their conversations"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_conversation_member(conversation_id, auth.uid())
  );

-- ====================================================================
-- 5. Storage Configuration (InsForge Storage for File & Image Attachments)
-- ====================================================================
-- In your InsForge Dashboard -> Storage:
-- 1. Create a Bucket named: "chat-attachments"
-- 2. Toggle "Public Bucket": Enabled (allows chat participants to download and view files)
-- 3. Allowed MIME types: images (image/*), documents (application/pdf, application/msword,
--    application/zip, text/plain, etc.)
-- 4. Max file size: 15MB
--
-- Real-time delivery: Messages containing attachments are transmitted immediately
-- across WebSocket channels using InsForge Realtime with zero latency.
-- If no storage bucket is configured, Nexora Chat automatically falls back to optimized
-- client-side data URLs so file sharing works continuously without interruption.
-- ====================================================================
