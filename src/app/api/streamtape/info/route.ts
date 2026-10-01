import { NextResponse } from 'next/server';
import { getStreamtapeFileInfo } from '@/lib/server/streamtape';

export async function GET(request: Request) {
  const values = new URL(request.url).searchParams.get('file')?.split(',').map((id) => id.trim()).filter(Boolean) ?? [];
  if (values.length === 0 || values.length > 100 || values.some((id) => !/^[A-Za-z0-9_-]+$/.test(id))) {
    return NextResponse.json({ success: false, error: 'Provide 1 to 100 valid file IDs.' }, { status: 400 });
  }

  try {
    const files = await getStreamtapeFileInfo(values);
    return NextResponse.json({ success: true, files }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[Streamtape info] Request failed:', error);
    return NextResponse.json({ success: false, error: 'Could not fetch Streamtape file info.' }, { status: 502 });
  }
}
