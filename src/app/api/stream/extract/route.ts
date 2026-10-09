import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tmdb_id = searchParams.get("tmdb_id");
  const type = searchParams.get("type");
  const season = searchParams.get("season")
    ? Number(searchParams.get("season"))
    : 1;
  const episode = searchParams.get("episode")
    ? Number(searchParams.get("episode"))
    : 1;

  if (!tmdb_id || !type || !["movie", "tv"].includes(type)) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Missing or invalid parameters. Required: tmdb_id, type (movie|tv). For TV: season, episode.",
      },
      { status: 400 },
    );
  }

  const isMovie = type === "movie";
  const subtitleUrl = searchParams.get("sub_url");
  const subtitleLabel = searchParams.get("sub_label");
  const subtitleLanguage = searchParams.get("sub_lang");
  let parsedSubtitleUrl: URL | null = null;

  if (subtitleUrl) {
    try {
      parsedSubtitleUrl = new URL(subtitleUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: "sub_url must be a valid HTTPS URL." },
        { status: 400 },
      );
    }
    if (parsedSubtitleUrl.protocol !== "https:") {
      return NextResponse.json(
        { success: false, error: "sub_url must use HTTPS." },
        { status: 400 },
      );
    }
  } else if (subtitleLabel || subtitleLanguage) {
    return NextResponse.json(
      { success: false, error: "sub_label and sub_lang require sub_url." },
      { status: 400 },
    );
  }

  if (subtitleLanguage && !/^[a-zA-Z]{2,3}$/.test(subtitleLanguage)) {
    return NextResponse.json(
      {
        success: false,
        error: "sub_lang must be a 2- or 3-letter language code.",
      },
      { status: 400 },
    );
  }
  if (subtitleLabel && subtitleLabel.length > 100) {
    return NextResponse.json(
      { success: false, error: "sub_label must be 100 characters or fewer." },
      { status: 400 },
    );
  }

  const vidsrc2Params = new URLSearchParams({
    autoplay: "1",
    ds_lang: "en",
  });
  if (parsedSubtitleUrl) {
    vidsrc2Params.set("sub_url", parsedSubtitleUrl.toString());
    if (subtitleLabel) vidsrc2Params.set("sub_label", subtitleLabel);
    if (subtitleLanguage) vidsrc2Params.set("sub_lang", subtitleLanguage);
  }

  const sources = [
    {
      name: "MoviesAPI",
      url: isMovie
        ? `https://moviesapi.to/movie/${tmdb_id}`
        : `https://moviesapi.to/tv/${tmdb_id}/${season}/${episode}`,
      type: "iframe",
    },
    {
      name: "Vidsrc2",
      url: isMovie
        ? `https://vidsrc2.ru/embed/movie/${tmdb_id}?${vidsrc2Params.toString()}`
        : `https://vidsrc2.ru/embed/tv/${tmdb_id}/${season}/${episode}?${vidsrc2Params.toString()}&autonext=1`,
      type: "iframe",
    },
    {
      name: "VidCore",
      url: isMovie
        ? `https://vidcore.org/embed/movie/${tmdb_id}?theme=7B2FFF&autoplay=true`
        : `https://vidcore.org/embed/tv/${tmdb_id}/${season}/${episode}?theme=7B2FFF&autoplay=true`,
      type: "iframe",
    },
    {
      name: "VidCore.io",
      url: isMovie
        ? `https://vidcore.net/movie/${tmdb_id}?theme=7B2FFF&autoPlay=true`
        : `https://vidcore.net/tv/${tmdb_id}/${season}/${episode}?theme=7B2FFF&autoPlay=true&nextButton=true`,
      type: "iframe",
    },
  ];

  return NextResponse.json(
    { success: true, sources },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=60",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
