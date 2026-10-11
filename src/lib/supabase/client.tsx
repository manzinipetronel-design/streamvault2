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

async function hashMockPin(pin: string, salt: Uint8Array<ArrayBuffer>) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const digest = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 },
    key,
    256
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(hex.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) ?? []);
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
    async rpc(functionName: string, args: Record<string, string> = {}) {
      const userId = getStoredUser()?.id;
      if (!userId) return { data: null, error: new Error('Authentication required') };

      const controls = getStorage('kids_parental_controls');
      const saved = controls.find((row) => row.user_id === userId);
      if (functionName === 'has_kids_pin') {
        return { data: Boolean(saved), error: null };
      }
      if (functionName === 'set_kids_pin') {
        if (saved) {
          return { data: null, error: new Error('A parental PIN is already configured') };
        }
        const pin = args.p_pin;
        if (!/^\d{4,6}$/.test(pin ?? '')) {
          return { data: null, error: new Error('PIN must contain 4 to 6 digits') };
        }
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const saltHex = Array.from(salt, (byte) => byte.toString(16).padStart(2, '0')).join('');
        const pinHash = await hashMockPin(pin, salt);
        const next = controls.filter((row) => row.user_id !== userId);
        next.push({ user_id: userId, pin_salt: saltHex, pin_hash: pinHash });
        setStorage('kids_parental_controls', next);
        return { data: null, error: null };
      }
      if (functionName === 'change_kids_pin') {
        const currentPin = args.p_current_pin;
        const newPin = args.p_new_pin;
        if (!saved || !/^\d{4,6}$/.test(currentPin ?? '') || !/^\d{4,6}$/.test(newPin ?? '')) {
          return { data: null, error: new Error('Current and new PINs must contain 4 to 6 digits') };
        }
        const currentHash = await hashMockPin(currentPin, hexToBytes(saved.pin_salt));
        if (currentHash !== saved.pin_hash) {
          return { data: null, error: new Error('Current PIN is incorrect') };
        }
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const saltHex = Array.from(salt, (byte) => byte.toString(16).padStart(2, '0')).join('');
        const pinHash = await hashMockPin(newPin, salt);
        const next = controls.map((row) =>
          row.user_id === userId ? { ...row, pin_salt: saltHex, pin_hash: pinHash } : row
        );
        setStorage('kids_parental_controls', next);
        return { data: null, error: null };
      }
      if (functionName === 'verify_kids_pin') {
        const pin = args.p_pin;
        if (!saved || !/^\d{4,6}$/.test(pin ?? '')) return { data: false, error: null };
        const actual = await hashMockPin(pin, hexToBytes(saved.pin_salt));
        return { data: actual === saved.pin_hash, error: null };
      }
      return { data: null, error: new Error(`Unsupported mock RPC: ${functionName}`) };
    },
    from(tableName: string) {
      const filters: Array<(row: any) => boolean> = [];
      let orderByCol: string | null = null;
      let orderAsc = true;
      let limitCount: number | null = null;
      let updateValues: Record<string, any> | null = null;
      let deleteRequested = false;

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
                  r.media_id === item.media_id &&
                  (!item.media_type || r.media_type === item.media_type)) ||
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
        update(values: Record<string, any>) {
          updateValues = values;
          return chain;
        },
        delete() {
          deleteRequested = true;
          return chain;
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
          let rows = getStorage(tableName);
          if (deleteRequested) {
            const removed = rows.filter((row) => filters.every((filter) => filter(row)));
            rows = rows.filter((row) => !filters.every((filter) => filter(row)));
            setStorage(tableName, rows);
            rows = removed;
            deleteRequested = false;
          }
          if (updateValues) {
            rows = rows.map((row) =>
              filters.every((filter) => filter(row)) ? { ...row, ...updateValues } : row
            );
            setStorage(tableName, rows);
            updateValues = null;
          }
          rows = rows.filter((r) => filters.every((f) => f(r)));
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
