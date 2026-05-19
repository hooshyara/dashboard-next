import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminFromToken, isAdminOnlyPath } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const token = request.cookies.get('token')?.value;
  const userId = request.cookies.get('userId')?.value;
  const isAuthed = Boolean(token) && Boolean(userId);

  const tokenFromQuery = searchParams.get('token');
  const userIdFromQuery = searchParams.get('userId');

  if (tokenFromQuery && userIdFromQuery && !isAuthed) {
    const url = request.nextUrl.clone();
    url.searchParams.delete('token');
    url.searchParams.delete('userId');
    const res = NextResponse.redirect(url);
    res.cookies.set('token', tokenFromQuery, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.cookies.set('userId', userIdFromQuery, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return res;
  }

  if (!isAuthed && !pathname.includes('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthed && pathname.includes('/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isAuthed && isAdminOnlyPath(pathname) && !isAdminFromToken(token)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|images|fonts|assets).*)'],
};
