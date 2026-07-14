import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SERVICE = 'cert.i-ve.ai';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
} as const;

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: SERVICE,
      version: process.env.APP_VERSION ?? 'unknown',
      commit: process.env.GIT_COMMIT ?? 'unknown',
      builtAt: process.env.BUILD_TIMESTAMP ?? null,
    },
    { headers: CORS_HEADERS },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Accept, Content-Type',
      'Access-Control-Max-Age': '3600',
    },
  });
}
