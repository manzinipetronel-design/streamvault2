import { CalendarDays, Sparkles } from 'lucide-react';
import { formatReleaseDate, isUpcomingRelease } from '@/lib/releaseDate';

interface UpcomingBadgeProps {
  releaseDate?: string;
  showDate?: boolean;
  featured?: boolean;
}

export default function UpcomingBadge({
  releaseDate,
  showDate = false,
  featured = false,
}: UpcomingBadgeProps) {
  if (!isUpcomingRelease(releaseDate)) return null;

  return (
    <span
      aria-label={`Coming soon${releaseDate && showDate ? `, releases ${formatReleaseDate(releaseDate)}` : ''}`}
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200/25 bg-gradient-to-r from-amber-300/15 via-violet-400/15 to-white/[0.06] font-semibold text-amber-100 shadow-[0_0_24px_rgba(245,190,90,0.12)] backdrop-blur-xl ${
        featured
          ? 'px-3 py-1.5 text-[10px] uppercase tracking-[0.16em]'
          : 'px-2 py-1 text-[9px] uppercase tracking-[0.12em]'
      }`}
    >
      {featured ? (
        <CalendarDays className="h-3.5 w-3.5 text-amber-200" aria-hidden="true" />
      ) : (
        <Sparkles className="h-3 w-3 text-amber-200" aria-hidden="true" />
      )}
      <span>{showDate && releaseDate ? `Premiere · ${formatReleaseDate(releaseDate)}` : 'Coming soon'}</span>
    </span>
  );
}
