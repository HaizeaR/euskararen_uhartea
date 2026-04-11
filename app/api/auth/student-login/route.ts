import { NextRequest, NextResponse } from 'next/server';
import { db, classrooms, groups } from '@/db';
import { eq, and } from 'drizzle-orm';
import { signJWT, setCookieToken } from '@/lib/auth';
import { isMissingTableError } from '@/lib/db-errors';

export async function POST(req: NextRequest) {
  try {
    const { code, group_id } = await req.json();

    if (!code || !group_id) {
      return NextResponse.json({ error: 'Kodea eta taldea beharrezkoak dira' }, { status: 400 });
    }

    const [classroom] = await db
      .select()
      .from(classrooms)
      .where(and(eq(classrooms.code, code.toUpperCase()), eq(classrooms.is_active, true)))
      .limit(1);

    if (!classroom) {
      return NextResponse.json({ error: 'Kode okerra edo klase ez aktiboa' }, { status: 404 });
    }

    const [group] = await db
      .select()
      .from(groups)
      .where(and(eq(groups.id, parseInt(group_id)), eq(groups.classroom_id, classroom.id)))
      .limit(1);

    if (!group) {
      return NextResponse.json({ error: 'Taldea ez da aurkitu' }, { status: 404 });
    }

    const token = await signJWT({
      role: 'student',
      groupId: group.id,
      classroomId: classroom.id,
    });
    const { name, value, options } = setCookieToken(token);

    const res = NextResponse.json({ ok: true, group });
    res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
    return res;
  } catch (err) {
    console.error(err);
    if (isMissingTableError(err)) {
      return NextResponse.json(
        { error: 'Datu-basea ez dago hasieratuta. Exekutatu db:push lehenengo.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}
