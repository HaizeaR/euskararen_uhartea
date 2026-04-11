import { NextResponse } from 'next/server';
import { db, day_entries, groups, classrooms } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher' || !session.userId) {
      return NextResponse.json({ error: 'Baimena beharrezkoa da' }, { status: 403 });
    }

    const history = await db
      .select({
        id: day_entries.id,
        entry_date: day_entries.entry_date,
        score: day_entries.score,
        advance: day_entries.advance,
        validated_by_teacher: day_entries.validated_by_teacher,
        group_id: groups.id,
        group_name: groups.name,
        group_color: groups.color,
        character_index: groups.character_index,
      })
      .from(day_entries)
      .innerJoin(groups, eq(day_entries.group_id, groups.id))
      .innerJoin(classrooms, eq(groups.classroom_id, classrooms.id))
      .where(eq(classrooms.teacher_id, session.userId))
      .orderBy(desc(day_entries.entry_date), desc(day_entries.id));

    return NextResponse.json(history);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}
