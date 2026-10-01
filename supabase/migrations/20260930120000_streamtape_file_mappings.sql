CREATE TABLE IF NOT EXISTS streamtape_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  season INTEGER NOT NULL DEFAULT 0 CHECK (season >= 0),
  episode INTEGER NOT NULL DEFAULT 0 CHECK (episode >= 0),
  streamtape_file_id TEXT NOT NULL UNIQUE,
  name TEXT,
  size BIGINT,
  mime_type TEXT,
  converted BOOLEAN NOT NULL DEFAULT false,
  provider_status INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT streamtape_episode_coordinates CHECK (
    (media_type = 'movie' AND season = 0 AND episode = 0)
    OR (media_type = 'tv' AND season > 0 AND episode > 0)
  ),
  UNIQUE (tmdb_id, media_type, season, episode)
);

ALTER TABLE streamtape_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Streamtape mappings are readable"
  ON streamtape_files FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS streamtape_files_media_lookup
  ON streamtape_files (tmdb_id, media_type, season, episode);
