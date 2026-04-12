import { NextRequest, NextResponse } from 'next/server';
import { db, day_entries, groups, classrooms } from '@/db';
import { eq } from 'drizzle-orm';
import { getSessionFromRequest } from '@/lib/auth';
import { WEEKLY_SCHEDULE } from '@/lib/schedule';

// PATCH /api/entries/[id]
// Student: can edit own entry only if NOT validated
// Teacher: can edit any entry
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Baimena beharrezkoa da' }, { status: 403 });

    const id = parseInt(params.id);
    const [entry] = await db.select().from(day_entries).where(eq(day_entries.id, id)).limit(1);
    if (!entry) return NextResponse.json({ error: 'Sarrera ez da aurkitu' }, { status: 404 });

    if (session.role === 'student') {
      if (session.groupId !== entry.group_id)
        return NextResponse.json({ error: 'Baimena ukatua' }, { status: 403 });
      if (entry.validated_by_teacher)
        return NextResponse.json({ error: 'Irakasleak balioztatutako sarrerak ezin dira editatu' }, { status: 403 });
    }

    const body = await req.json();

    const fields = [
      'class_1_euskera','class_1_errespetua',
      'class_2_euskera','class_2_errespetua',
      'class_3_euskera','class_3_errespetua',
      'class_4_euskera','class_4_errespetua',
      'class_5_euskera','class_5_errespetua',
    ] as const;

    const boolValues: Record<string, boolean> = {};
    let trueCount = 0;
    for (const f of fields) {
      const val = Boolean(body[f]);
      boolValues[f] = val;
      if (val) trueCount++;
    }

    // Use the schedule for the entry's date to normalize score correctly
    const entryDow = new Date(entry.entry_date + 'T12:00:00').getDay();
    const subjects = WEEKLY_SCHEDULE[entryDow] ?? [];
    const maxPoints = subjects.length > 0 ? subjects.length * 2 : 10;
    const newScore = Math.round((trueCount / maxPoints) * 10);
    const newAdvance = newScore / 2;

    const updatePayload: Record<string, unknown> = { ...boolValues, score: newScore, advance: String(newAdvance) };
    if (session.role === 'teacher' && typeof body.validated_by_teacher === 'boolean') {
      updatePayload.validated_by_teacher = body.validated_by_teacher;
    }

    const [updated] = await db
      .update(day_entries)
      .set(updatePayload)
      .where(eq(day_entries.id, id))
      .returning();

    // Adjust group position by the score delta
    const oldAdvance = parseFloat(String(entry.advance));
    const diff = newAdvance - oldAdvance;
    if (diff !== 0) {
      const [group] = await db.select().from(groups).where(eq(groups.id, entry.group_id)).limit(1);
      if (group) {
        const [classroom] = await db.select().from(classrooms).where(eq(classrooms.id, group.classroom_id)).limit(1);
        const total = classroom?.map_total ?? 50;
        const newPos = Math.min(Math.max(0, parseFloat(String(group.position)) + diff), total);
        await db.update(groups).set({ position: String(newPos) }).where(eq(groups.id, group.id));
      }
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}
