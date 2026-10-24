import { NextResponse } from 'next/server';

// Legacy clients may still call this URL. Never read, log or forward the body.
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error:
        'Les rapports distants ont été retirés. Tes données restent sur ton appareil.',
    },
    { status: 410, headers: { 'cache-control': 'no-store' } },
  );
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Méthode non autorisée.' },
    { status: 405, headers: { 'cache-control': 'no-store' } },
  );
}
