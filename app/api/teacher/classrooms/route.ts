import { NextResponse } from 'next/server';
import { db, classrooms, users } from '@/db';
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
