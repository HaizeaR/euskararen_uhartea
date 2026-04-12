import { NextResponse } from 'next/server';
import { db, day_entries, groups, classrooms } from '@/db';
import { eq, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

// POST /api/teacher/reset
// Deletes all day_entries and resets group positions to 0 for the teacher's classroom.
// Groups, student names, and characters are preserved.
export async function POST() {
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

    // Get all group IDs for this classroom
    const classroomGroups = await db
      .select({ id: groups.id })
      .from(groups)
      .where(eq(groups.classroom_id, classroom.id));

    const groupIds = classroomGroups.map(g => g.id);

    let deletedEntries = 0;

    if (groupIds.length > 0) {
      // Delete all day_entries for these groups
      const deleted = await db
        .delete(day_entries)
        .where(inArray(day_entries.group_id, groupIds))
        .returning({ id: day_entries.id });
      deletedEntries = deleted.length;

      // Reset positions to 0 and clear student names (force re-setup)
      await db
        .update(groups)
        .set({ position: '0', student_name: null })
        .where(inArray(groups.id, groupIds));
    }

    return NextResponse.json({
      ok: true,
      deletedEntries,
      resetGroups: groupIds.length,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}
