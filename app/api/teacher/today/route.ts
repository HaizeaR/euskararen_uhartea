import { NextResponse } from 'next/server';
import { db, day_entries, groups, classrooms } from '@/db';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher' || !session.userId) {
      return NextResponse.json({ error: 'Baimena beharrezkoa da' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];

    // All groups in teacher's classroom
    const [classroom] = await db
      .select()
      .from(classrooms)
      .where(eq(classrooms.teacher_id, session.userId))
      .limit(1);

    if (!classroom) {
      return NextResponse.json({ groups: [], entries: [] });
    }

    const allGroups = await db
      .select()
      .from(groups)
      .where(eq(groups.classroom_id, classroom.id));

    // Today's entries for those groups
    const todayEntries = await db
      .select()
      .from(day_entries)
      .innerJoin(groups, eq(day_entries.group_id, groups.id))
      .where(
        and(
          eq(groups.classroom_id, classroom.id),
          eq(day_entries.entry_date, today),
        )
      );

    return NextResponse.json({
      classroom,
      groups:  allGroups,
      entries: todayEntries.map(r => r.day_entries),
      today,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}
