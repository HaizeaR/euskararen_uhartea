import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { signJWT, setCookieToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Eremu guztiak beharrezkoak dira' }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Erabiltzaile edo pasahitz okerra' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Erabiltzaile edo pasahitz okerra' }, { status: 401 });
    }

    const token = await signJWT({ userId: user.id, role: 'teacher' });
    const { name, value, options } = setCookieToken(token);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}
