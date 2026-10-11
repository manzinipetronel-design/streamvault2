import { cookies } from 'next/headers';
import type { UserProfile } from '@/types/profile';

export const PROFILE_COOKIE_NAME = 'streamvault_active_profile';

export function parseProfileCookieValue(value?: string): UserProfile | null {
  if (!value) return null;

  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as Partial<UserProfile>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.id !== 'string' || typeof parsed.name !== 'string' || typeof parsed.avatar !== 'string') {
      return null;
    }
    return {
      id: parsed.id,
      name: parsed.name,
      avatar: parsed.avatar,
      isKids: Boolean(parsed.isKids),
    };
  } catch {
    return null;
  }
}

export async function getActiveProfileFromCookie(): Promise<UserProfile | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(PROFILE_COOKIE_NAME)?.value;
  return parseProfileCookieValue(value ?? undefined);
}

export async function getIsKidsProfile(): Promise<boolean> {
  return (await getActiveProfileFromCookie())?.isKids === true;
}
