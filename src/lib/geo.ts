import { headers } from 'next/headers';

const ISO_2 = /^[A-Z]{2}$/;

// Headers a hosting provider or CDN may already attach with the visitor's
// country, so we can skip an extra network call when one is present.
const GEO_HEADER_NAMES = ['x-vercel-ip-country', 'cf-ipcountry', 'x-country-code'];

/**
 * Best-effort ISO 3166-1 alpha-2 country code for the current visitor.
 * Tries CDN/hosting geo headers first, then falls back to a keyless IP
 * lookup. Defaults to 'US' if nothing resolves (e.g. localhost in dev) —
 * never throws, since this is used to pick which row to show, not
 * anything load-bearing.
 */
export async function getVisitorCountry(): Promise<string> {
  try {
    const headerList = await headers();

    for (const name of GEO_HEADER_NAMES) {
      const value = headerList.get(name)?.toUpperCase();
      if (value && ISO_2.test(value) && value !== 'XX' && value !== 'T1') {
        return value;
      }
    }

    const forwardedFor = headerList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : headerList.get('x-real-ip');
    if (!ip) return 'US';

    const res = await fetch(`https://api.country.is/${ip}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return 'US';
    const data = await res.json();
    return typeof data.country === 'string' && ISO_2.test(data.country) ? data.country : 'US';
  } catch {
    return 'US';
  }
}

/** Human-readable region name for an ISO 3166-1 alpha-2 code, e.g. 'ZA' → 'South Africa'. */
export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}
