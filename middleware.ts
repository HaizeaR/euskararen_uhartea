import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

const TEACHER_ROUTES = ['/irakaslea'];
const STUDENT_ROUTES = ['/juego'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isTeacherRoute = TEACHER_ROUTES.some((r) => pathname.startsWith(r));
  const isStudentRoute = STUDENT_ROUTES.some((r) => pathname.startsWith(r));

  if (!isTeacherRoute && !isStudentRoute) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(req);

  if (!session) {
    if (isTeacherRoute) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (isTeacherRoute && session.role !== 'teacher') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (isStudentRoute && session.role !== 'student') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/irakaslea/:path*', '/juego/:path*'],
};
