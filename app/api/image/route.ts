import { NextRequest, NextResponse } from 'next/server';

function isAllowedHost(hostname: string): boolean {
  return (
    hostname === 'uploads.mangadex.org' ||
    hostname.endsWith('.mangadex.network') ||
    hostname === 'golgebahcesi.com' ||
    hostname.endsWith('.golgebahcesi.com')
  );
}

function getUpstreamHeaders(hostname: string): Record<string, string> {
  if (hostname === 'golgebahcesi.com' || hostname.endsWith('.golgebahcesi.com')) {
    return {
      'Referer': 'https://golgebahcesi.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
    };
  }
  return {
    'Referer': 'https://mangadex.org/',
    'User-Agent': 'Mozilla/5.0 (compatible; GeriDonenScans/1.0)',
  };
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse('Invalid url', { status: 400 });
  }

  if (!isAllowedHost(parsed.hostname)) {
    return new NextResponse('Forbidden host', { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      headers: getUpstreamHeaders(parsed.hostname),
      next: { revalidate: 86400 }, // cache 24h
    });

    if (!upstream.ok) {
      return new NextResponse('Upstream error', { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch {
    return new NextResponse('Proxy error', { status: 502 });
  }
}
