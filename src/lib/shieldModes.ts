// Client-side shield configuration for the media player.
//
//  max      – embed loads through /api/embed (ad scripts stripped, guard
//             injected) inside a sandbox with no popups / top-navigation.
//  standard – embed loads directly inside a sandbox with no popups /
//             top-navigation. Most compatible protection. (default)
//  off      – no sandbox. Use only if a source refuses to play otherwise.

export type ShieldMode = 'max' | 'standard' | 'off';

export const DEFAULT_SHIELD_MODE: ShieldMode = 'standard';

export const SHIELD_OPTIONS: { mode: ShieldMode; label: string; hint: string }[] = [
  {
    mode: 'max',
    label: 'Max',
    hint: 'Strips ad scripts through our server and blocks popups, hijacked links and redirects. Some players refuse to run this way; we fall back automatically.',
  },
  {
    mode: 'standard',
    label: 'Standard',
    hint: 'Blocks popups and top-page redirects with a browser sandbox. Works with most players.',
  },
  {
    mode: 'off',
    label: 'Off',
    hint: 'No protection. Only use this if a source will not play otherwise.',
  },
];

// Direct embeds: no allow-popups / allow-top-navigation => no new tabs, no hijacking this page.
export const POPUP_BLOCK_SANDBOX =
  'allow-scripts allow-same-origin allow-forms allow-presentation';
// Proxied embeds are served from OUR origin, so allow-same-origin must NOT be
// present or third-party code could read our session storage.
export const CLEAN_MODE_SANDBOX = 'allow-scripts allow-forms allow-presentation';

// How many times we silently restore a player that navigated itself away
// (ad redirect) before telling the viewer.
export const MAX_REDIRECT_RECOVERIES = 8;
// Max shield waits this long after the frame loads for the guard to check in;
// if it never does, the proxy returned an error page and we fall back.
export const GUARD_READY_TIMEOUT_MS = 6000;

const STORAGE_KEY = 'sv:shield-prefs:v1';

function isMode(value: unknown): value is ShieldMode {
  return value === 'max' || value === 'standard' || value === 'off';
}

function readPrefs(): Record<string, ShieldMode> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Record<string, ShieldMode> = {};
    for (const [source, mode] of Object.entries(parsed)) {
      if (isMode(mode)) out[source] = mode;
    }
    return out;
  } catch {
    return {};
  }
}

/** The mode last chosen for this source (remembered per source), or the default. */
export function getSavedShieldMode(sourceName: string): ShieldMode {
  const v = readPrefs()[sourceName];
  return isMode(v) ? v : DEFAULT_SHIELD_MODE;
}

export function saveShieldMode(sourceName: string, mode: ShieldMode) {
  try {
    const prefs = readPrefs();
    prefs[sourceName] = mode;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* storage unavailable – preference just won't persist */
  }
}
