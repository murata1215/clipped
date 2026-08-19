import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Server Action スキャン攻撃をブロックするミドルウェア
 * このアプリは Server Action を使用していないため、Next-Action ヘッダー付きリクエストは全て不正
 */
export function middleware(request: NextRequest) {
  if (request.headers.get('next-action')) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
