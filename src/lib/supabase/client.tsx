import { createBrowserClient } from '@supabase/ssr';

// Fallback in-memory / local storage mock when Supabase credentials are missing or offline
function getStorage(key: string): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`stream_db_${key}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStorage(key: string, data: any[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`stream_db_${key}`, JSON.stringify(data));
  } catch {
    // silent
  }
}

const authListeners = new Set<(event: string, session: any) => void>();

function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('stream_auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user: any) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem('stream_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('stream_auth_user');
    }
  } catch {
    // silent
  }
}

function createMockSupabaseClient() {
  return {
    auth: {
      async getSession() {
        const user = getStoredUser();
        const session = user ? { access_token: 'mock-token', user } : null;
        return { data: { session }, error: null };
      },
      onAuthStateChange(callback: (event: string, session: any) => void) {
        authListeners.add(callback);
        const user = getStoredUser();
        const session = user ? { access_token: 'mock-token', user } : null;
        setTimeout(() => callback('INITIAL_SESSION', session), 0);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authListeners.delete(callback);
              },
            },
          },
        };
      },
      async signUp(params: { email: string; password: string; options?: any }) {
        const user = {
          id: 'user-' + Math.random().toString(36).substring(2, 9),
          email: params.email,
          user_metadata: {
            full_name: params.options?.data?.full_name || params.email.split('@')[0],
            avatar_url: params.options?.data?.avatar_url || '',
          },
          created_at: new Date().toISOString(),
        };
        const session = { access_token: 'mock-token', user };
        setStoredUser(user);
        authListeners.forEach((fn) => fn('SIGNED_IN', session));
        return { data: { user, session }, error: null };
      },
      async signInWithPassword(params: { email: string; password: string }) {
        const user = {
          id: 'user-' + Math.random().toString(36).substring(2, 9),
          email: params.email,
          user_metadata: {
            full_name: params.email.split('@')[0],
            avatar_url: '',
          },
          created_at: new Date().toISOString(),
        };
        const session = { access_token: 'mock-token', user };
        setStoredUser(user);
        authListeners.forEach((fn) => fn('SIGNED_IN', session));
        return { data: { user, session }, error: null };
      },
      async signOut() {
        setStoredUser(null);
        authListeners.forEach((fn) => fn('SIGNED_OUT', null));
        return { error: null };
      },
      async getUser() {
        const user = getStoredUser();
        return { data: { user }, error: null };
      },
    },
    from(tableName: string) {
      const filters: Array<(row: any) => boolean> = [];
      let orderByCol: string | null = null;
      let orderAsc = true;
      let limitCount: number | null = null;

      const chain: any = {
        select() {
          return chain;
        },
        eq(col: string, val: any) {
          filters.push((r: any) => String(r[col]) === String(val));
          return chain;
        },
        match(obj: Record<string, any>) {
          filters.push((r: any) =>
            Object.entries(obj).every(([k, v]) => String(r[k]) === String(v))
          );
          return chain;
        },
        order(col: string, opts?: { ascending?: boolean }) {
          orderByCol = col;
          orderAsc = opts?.ascending ?? true;
          return chain;
        },
        limit(n: number) {
          limitCount = n;
          return chain;
        },
        async insert(values: any) {
          const rows = Array.isArray(values) ? values : [values];
          const current = getStorage(tableName);
          const newRows = rows.map((r) => ({
            id: r.id || 'id-' + Math.random().toString(36).substring(2, 9),
            ...r,
            created_at: r.created_at || new Date().toISOString(),
          }));
          setStorage(tableName, [...current, ...newRows]);
          return { data: newRows, error: null };
        },
        async upsert(values: any, _options?: any) {
          const rows = Array.isArray(values) ? values : [values];
          const current = getStorage(tableName);
          for (const item of rows) {
            const idx = current.findIndex(
              (r) =>
                (r.user_id &&
                  item.user_id &&
                  r.user_id === item.user_id &&
                  r.media_id === item.media_id) ||
                (r.id && item.id && r.id === item.id)
            );
            if (idx >= 0) {
              current[idx] = { ...current[idx], ...item };
            } else {
              current.push({
                id: item.id || 'id-' + Math.random().toString(36).substring(2, 9),
                ...item,
              });
            }
          }
          setStorage(tableName, current);
          return { data: rows[0], error: null };
        },
        async delete() {
          const current = getStorage(tableName);
          const remaining = current.filter((r) => !filters.every((f) => f(r)));
          setStorage(tableName, remaining);
          return { data: null, error: null };
        },
        async maybeSingle() {
          const current = getStorage(tableName);
          const matched = current.filter((r) => filters.every((f) => f(r)));
          return { data: matched[0] || null, error: null };
        },
        async single() {
          const current = getStorage(tableName);
          const matched = current.filter((r) => filters.every((f) => f(r)));
          return { data: matched[0] || null, error: null };
        },
        then(onfulfilled: any, onrejected?: any) {
          let rows = getStorage(tableName).filter((r) => filters.every((f) => f(r)));
          if (orderByCol) {
            rows.sort((a, b) => {
              const va = a[orderByCol!];
              const vb = b[orderByCol!];
              if (va < vb) return orderAsc ? -1 : 1;
              if (va > vb) return orderAsc ? 1 : -1;
              return 0;
            });
          }
          if (limitCount !== null) {
            rows = rows.slice(0, limitCount);
          }
          return Promise.resolve({ data: rows, error: null }).then(onfulfilled, onrejected);
        },
      };

      return chain;
    },
  };
}

let cachedClient: any = null;

export function createClient() {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  const isValidUrl = Boolean(url && (url.startsWith('https://') || url.startsWith('http://')));

  if (isValidUrl && key) {
    try {
      cachedClient = createBrowserClient(url!, key);
      return cachedClient;
    } catch {
      // Fallback if browser client creation fails
      cachedClient = createMockSupabaseClient();
      return cachedClient;
    }
  }

  // Graceful in-memory / localStorage fallback when credentials aren't set
  cachedClient = createMockSupabaseClient();
  return cachedClient;
}
