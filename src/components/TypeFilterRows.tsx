import MovieRow from '@/components/MovieRow';

type RowMediaType = 'movie' | 'tv';

export interface TypedRowSection {
  title: string;
  items: any[];
  isMock?: boolean;
  showRank?: boolean;
  mediaType?: RowMediaType;
  viewAllHref?: string;
}

interface TypeFilterRowsProps {
  sections: TypedRowSection[];
}

export default function TypeFilterRows({ sections }: TypeFilterRowsProps) {
  return (
    <div className="relative z-20 pb-32 -mt-8 flex flex-col">
      {sections.map((section) => (
        <MovieRow key={section.title} {...section} spotlightStyles />
      ))}
    </div>
  );
}
