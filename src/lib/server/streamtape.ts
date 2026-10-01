import { createClient } from '@supabase/supabase-js';

const STREAMTAPE_API = 'https://api.streamtape.com/file';

export type StreamtapeFileInfo = {
  id: string;
  name?: string;
  size?: number;
  type?: string;
  converted?: boolean;
  status?: number;
};

export async function getStreamtapeFileInfo(fileIds: string[]) {
  const login = process.env.STREAMTAPE_LOGIN;
  const key = process.env.STREAMTAPE_KEY || process.env.STREAMTAPE_API_PASSWORD;
  if (!login || !key) throw new Error('Streamtape is not configured.');

  const params = new URLSearchParams({
    file: fileIds.join(','),
    login,
    key,
  });
  const response = await fetch(`${STREAMTAPE_API}/info?${params}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok || data.status !== 200) {
    throw new Error(data.msg || 'Streamtape file info request failed.');
  }

  return data.result as Record<string, StreamtapeFileInfo>;
}

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Supabase service role is not configured.');
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

export function isStreamtapeAdmin(request: Request) {
  const expected = process.env.STREAMTAPE_ADMIN_TOKEN;
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return Boolean(expected && provided && provided === expected);
}
