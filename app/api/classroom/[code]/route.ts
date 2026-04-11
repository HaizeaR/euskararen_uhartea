import { NextRequest, NextResponse } from 'next/server';
import { db, classrooms, groups } from '@/db';
import { eq, and } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code.toUpperCase();

    const [classroom] = await db
      .select()
      .from(classrooms)
      .where(and(eq(classrooms.code, code), eq(classrooms.is_active, true)))
      .limit(1);

    if (!classroom) {
      return NextResponse.json({ error: 'Klase ez da aurkitu' }, { status: 404 });
    }

    const groupList = await db
      .select()
      .from(groups)
      .where(eq(groups.classroom_id, classroom.id));

    return NextResponse.json({ classroom, groups: groupList });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}
