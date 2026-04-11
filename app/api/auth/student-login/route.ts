import { NextRequest, NextResponse } from 'next/server';
import { db, groups, classrooms } from '@/db';
import { eq, and } from 'drizzle-orm';
import { signJWT, setCookieToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Talde-kodea beharrezkoa da' }, { status: 400 });
    }

    const [result] = await db
      .select({
        id:             groups.id,
        classroom_id:   groups.classroom_id,
        code:           groups.code,
        name:           groups.name,
        student_name:   groups.student_name,
        character_index: groups.character_index,
        position:       groups.position,
        color:          groups.color,
      })
      .from(groups)
      .innerJoin(classrooms, eq(groups.classroom_id, classrooms.id))
      .where(and(
        eq(groups.code, code.trim().toUpperCase()),
        eq(classrooms.is_active, true),
      ))
      .limit(1);

    if (!result) {
      return NextResponse.json({ error: 'Talde-kode okerra edo klase ez aktiboa' }, { status: 404 });
    }

    const token = await signJWT({
      role:        'student',
      groupId:     result.id,
      classroomId: result.classroom_id,
    });
    const { name, value, options } = setCookieToken(token);

    const needsSetup = !result.student_name;

    const res = NextResponse.json({ ok: true, group: result, needsSetup });
    res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}
