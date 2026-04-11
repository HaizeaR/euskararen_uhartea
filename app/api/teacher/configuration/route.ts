import { NextRequest, NextResponse } from 'next/server';
import { db, classrooms, users } from '@/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher' || !session.userId) {
      return NextResponse.json({ error: 'Baimena beharrezkoa da' }, { status: 403 });
    }

    const [classroom] = await db
      .select()
      .from(classrooms)
      .where(eq(classrooms.teacher_id, session.userId))
      .limit(1);

    if (!classroom) {
      return NextResponse.json({ error: 'Klaserik ez da aurkitu' }, { status: 404 });
    }

    return NextResponse.json({ classroom });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher' || !session.userId) {
      return NextResponse.json({ error: 'Baimena beharrezkoa da' }, { status: 403 });
    }

    const body = await req.json();

    const [teacher] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!teacher) {
      return NextResponse.json({ error: 'Erabiltzailea ez da aurkitu' }, { status: 404 });
    }

    if (body.currentPassword && body.newPassword) {
      const valid = await bcrypt.compare(body.currentPassword, teacher.password_hash);
      if (!valid) {
        return NextResponse.json({ error: 'Uneko pasahitza okerra da' }, { status: 400 });
      }

      const newHash = await bcrypt.hash(body.newPassword, 10);
      await db
        .update(users)
        .set({ password_hash: newHash })
        .where(eq(users.id, teacher.id));
    }

    const classroomUpdate: Partial<{ name: string; map_total: number; is_active: boolean }> = {};
    if (body.classroomName !== undefined) classroomUpdate.name = String(body.classroomName);
    if (body.mapTotal !== undefined) classroomUpdate.map_total = Number(body.mapTotal);
    if (body.isActive !== undefined) classroomUpdate.is_active = Boolean(body.isActive);

    let classroom = null;
    if (Object.keys(classroomUpdate).length > 0) {
      const [updated] = await db
        .update(classrooms)
        .set(classroomUpdate)
        .where(eq(classrooms.teacher_id, teacher.id))
        .returning();
      classroom = updated ?? null;
    } else {
      [classroom] = await db
        .select()
        .from(classrooms)
        .where(eq(classrooms.teacher_id, teacher.id))
        .limit(1);
    }

    return NextResponse.json({ ok: true, classroom });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}
