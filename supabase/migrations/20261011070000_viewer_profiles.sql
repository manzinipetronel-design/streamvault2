CREATE TABLE IF NOT EXISTS public.viewer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 30),
  avatar_url TEXT NOT NULL,
  is_kids BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS viewer_profiles_user_created_idx
  ON public.viewer_profiles (user_id, created_at);

ALTER TABLE public.viewer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own viewer profiles" ON public.viewer_profiles;
CREATE POLICY "Users can view their own viewer profiles"
  ON public.viewer_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own viewer profiles" ON public.viewer_profiles;
CREATE POLICY "Users can create their own viewer profiles"
  ON public.viewer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own viewer profiles" ON public.viewer_profiles;
CREATE POLICY "Users can update their own viewer profiles"
  ON public.viewer_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own viewer profiles" ON public.viewer_profiles;
CREATE POLICY "Users can delete their own viewer profiles"
  ON public.viewer_profiles FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.viewer_profiles TO authenticated;

DROP POLICY IF EXISTS "Users can read their own viewer presence" ON realtime.messages;
CREATE POLICY "Users can read their own viewer presence"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (
    extension = 'presence'
    AND realtime.topic() = 'watching:' || (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Users can publish their own viewer presence" ON realtime.messages;
CREATE POLICY "Users can publish their own viewer presence"
  ON realtime.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    extension = 'presence'
    AND realtime.topic() = 'watching:' || (SELECT auth.uid())::text
  );
