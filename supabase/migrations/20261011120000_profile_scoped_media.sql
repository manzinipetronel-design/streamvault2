ALTER TABLE public.viewer_profiles
  ADD CONSTRAINT viewer_profiles_user_id_id_unique UNIQUE (user_id, id);

DO $$
DECLARE
  table_name TEXT;
  constraint_name TEXT;
  index_oid OID;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'user_favorites',
    'user_watchlist',
    'user_ratings',
    'user_history',
    'recent_watched',
    'user_watched',
    'recently_watched',
    'watch_history'
  ] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS profile_id UUID',
      table_name
    );

    IF table_name = 'user_history' THEN
      ALTER TABLE public.user_history
        ADD COLUMN IF NOT EXISTS poster_path TEXT,
        ADD COLUMN IF NOT EXISTS genre TEXT,
        ADD COLUMN IF NOT EXISTS year TEXT,
        ADD COLUMN IF NOT EXISTS rating TEXT,
        ADD COLUMN IF NOT EXISTS season INTEGER,
        ADD COLUMN IF NOT EXISTS episode INTEGER,
        ADD COLUMN IF NOT EXISTS season_number INTEGER,
        ADD COLUMN IF NOT EXISTS episode_number INTEGER,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

      UPDATE public.user_history
      SET updated_at = COALESCE(updated_at, last_watched, created_at, now())
      WHERE updated_at IS NULL;
    END IF;

    FOR constraint_name IN
      SELECT constraint_row.conname
      FROM pg_constraint AS constraint_row
      WHERE constraint_row.conrelid = to_regclass(format('public.%I', table_name))
        AND constraint_row.contype = 'u'
        AND pg_get_constraintdef(constraint_row.oid) LIKE '%user_id%'
        AND pg_get_constraintdef(constraint_row.oid) LIKE '%media_id%'
    LOOP
      EXECUTE format(
        'ALTER TABLE public.%I DROP CONSTRAINT %I',
        table_name,
        constraint_name
      );
    END LOOP;

    FOR index_oid IN
      SELECT index_row.indexrelid
      FROM pg_index AS index_row
      WHERE index_row.indrelid = to_regclass(format('public.%I', table_name))
        AND index_row.indisunique
        AND NOT index_row.indisprimary
        AND NOT EXISTS (
          SELECT 1
          FROM pg_constraint AS constraint_row
          WHERE constraint_row.conindid = index_row.indexrelid
        )
        AND pg_get_indexdef(index_row.indexrelid) LIKE '%user_id%'
        AND pg_get_indexdef(index_row.indexrelid) LIKE '%media_id%'
        AND pg_get_indexdef(index_row.indexrelid) NOT LIKE '%profile_id%'
    LOOP
      EXECUTE format('DROP INDEX %s', index_oid::regclass);
    END LOOP;

    EXECUTE format(
      'CREATE UNIQUE INDEX IF NOT EXISTS %I ON public.%I (user_id, profile_id, media_id, media_type)',
      table_name || '_user_profile_media_unique',
      table_name
    );

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint AS constraint_row
      WHERE constraint_row.conrelid = to_regclass(format('public.%I', table_name))
        AND constraint_row.conname = table_name || '_user_profile_fk'
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (user_id, profile_id) REFERENCES public.viewer_profiles (user_id, id) ON DELETE CASCADE',
        table_name,
        table_name || '_user_profile_fk'
      );
    END IF;

    EXECUTE format(
      'INSERT INTO public.viewer_profiles (user_id, display_name, avatar_url, is_kids, created_at)
       SELECT DISTINCT legacy.user_id, profile_defaults.display_name, profile_defaults.avatar_url, profile_defaults.is_kids
              , now() + profile_defaults.profile_order * interval ''1 second''
       FROM public.%I AS legacy
       JOIN auth.users AS auth_user ON auth_user.id = legacy.user_id
       CROSS JOIN LATERAL (
         VALUES
           (1, COALESCE(NULLIF(auth_user.raw_user_meta_data->>''full_name'', ''''), NULLIF(split_part(auth_user.email, ''@'', 1), ''''), ''Account''), ''/assets/avatars/profile-1.png'', false),
           (2, ''Guest'', ''/assets/avatars/profile-2.png'', false),
           (3, ''Kids'', ''/assets/avatars/profile-3.png'', true)
       ) AS profile_defaults(profile_order, display_name, avatar_url, is_kids)
       WHERE legacy.profile_id IS NULL
         AND NOT EXISTS (
           SELECT 1 FROM public.viewer_profiles existing
           WHERE existing.user_id = legacy.user_id
         )',
      table_name
    );

    WITH ordered_profiles AS (
      SELECT
        id,
        min(created_at) OVER (PARTITION BY user_id) AS first_created_at,
        row_number() OVER (
          PARTITION BY user_id
          ORDER BY
            created_at,
            CASE WHEN is_kids OR lower(display_name) IN ('guest', 'kids') THEN 1 ELSE 0 END,
            id
        ) AS profile_order
      FROM public.viewer_profiles
    )
    UPDATE public.viewer_profiles AS profile
    SET created_at = ordered_profiles.first_created_at
      + ((ordered_profiles.profile_order - 1) * interval '1 millisecond')
    FROM ordered_profiles
    WHERE profile.id = ordered_profiles.id;

    EXECUTE format(
      'UPDATE public.%I AS legacy
       SET profile_id = (
         SELECT profile.id
         FROM public.viewer_profiles AS profile
         WHERE profile.user_id = legacy.user_id
         ORDER BY profile.created_at, profile.id
         LIMIT 1
       )
       WHERE legacy.profile_id IS NULL
         AND EXISTS (
           SELECT 1 FROM public.viewer_profiles profile
           WHERE profile.user_id = legacy.user_id
         )',
      table_name
    );
  END LOOP;
END
$$;
