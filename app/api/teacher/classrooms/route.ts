import { NextRequest, NextResponse } from 'next/server';
import { db, classrooms } from '@/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

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

    const [classroom] = await db
      .select()
      .from(classrooms)
      .where(eq(classrooms.teacher_id, session.userId))
      .limit(1);

    if (!classroom) {
      return NextResponse.json({ error: 'Klaserik ez da aurkitu' }, { status: 404 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.name       === 'string' && body.name.trim())       updates.name        = body.name.trim();
    if (typeof body.map_total  === 'number' && body.map_total > 0)     updates.map_total   = body.map_total;
    if (Array.isArray(body.class_names) && body.class_names.length === 5) {
      updates.class_names = JSON.stringify(body.class_names.map((n: unknown) => String(n).trim()));
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Daturik ez dago eguneratzeko' }, { status: 400 });
    }

    const [updated] = await db
      .update(classrooms)
      .set(updates)
      .where(eq(classrooms.id, classroom.id))
      .returning();

    return NextResponse.json({ classroom: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}
