import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

/**
 * Proxy to the Express API server with SSE passthrough.
 * This allows the Next.js frontend to call /api/generate without CORS issues
 * when both run behind the same domain in production.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  const upstream = await fetch(`${API_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'Upstream API error' }, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
