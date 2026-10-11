const PUBLIC_PATHS = ["/login", "/forgot-password", "/auth/callback"];

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
