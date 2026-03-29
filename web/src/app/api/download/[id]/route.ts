import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [ebookId, format] = id.split('.');
  const ext = format ?? 'pdf';

  const upstream = await fetch(`${API_URL}/api/download/${ebookId}/${ext}`);

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const contentType = ext === 'pdf' ? 'application/pdf' : 'text/markdown';
  const filename = upstream.headers.get('content-disposition') ?? `ebook.${ext}`;

  return new Response(upstream.body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': filename,
    },
  });
}
