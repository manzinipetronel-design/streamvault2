CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS kids_parental_controls (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE kids_parental_controls ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON kids_parental_controls FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.has_kids_pin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.kids_parental_controls
    WHERE user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.set_kids_pin(p_pin TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_pin !~ '^[0-9]{4,6}$' THEN
    RAISE EXCEPTION 'PIN must contain 4 to 6 digits';
  END IF;

  INSERT INTO public.kids_parental_controls (user_id, pin_hash)
  VALUES (auth.uid(), extensions.crypt(p_pin, extensions.gen_salt('bf', 12)));
END;
$$;

CREATE OR REPLACE FUNCTION public.change_kids_pin(p_current_pin TEXT, p_new_pin TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  current_hash TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_new_pin !~ '^[0-9]{4,6}$' THEN
    RAISE EXCEPTION 'PIN must contain 4 to 6 digits';
  END IF;

  SELECT pin_hash INTO current_hash
  FROM public.kids_parental_controls
  WHERE user_id = auth.uid()
  FOR UPDATE;

  IF current_hash IS NULL OR p_current_pin IS NULL
     OR extensions.crypt(p_current_pin, current_hash) IS DISTINCT FROM current_hash THEN
    RAISE EXCEPTION 'Current PIN is incorrect';
  END IF;

  UPDATE public.kids_parental_controls
  SET pin_hash = extensions.crypt(p_new_pin, extensions.gen_salt('bf', 12)),
      updated_at = now()
  WHERE user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_kids_pin(p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT COALESCE((
    SELECT extensions.crypt(p_pin, pin_hash) = pin_hash
    FROM public.kids_parental_controls
    WHERE user_id = auth.uid()
  ), false);
$$;

REVOKE ALL ON FUNCTION public.has_kids_pin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_kids_pin(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.change_kids_pin(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.verify_kids_pin(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_kids_pin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_kids_pin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_kids_pin(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_kids_pin(TEXT) TO authenticated;

CREATE TABLE IF NOT EXISTS kids_hidden_titles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT NOT NULL,
  poster_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, media_id, media_type)
);

ALTER TABLE kids_hidden_titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their hidden kids titles"
  ON kids_hidden_titles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can hide kids titles"
  ON kids_hidden_titles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their hidden kids titles"
  ON kids_hidden_titles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unhide kids titles"
  ON kids_hidden_titles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON kids_hidden_titles TO authenticated;
