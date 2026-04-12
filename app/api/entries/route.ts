import { NextRequest, NextResponse } from 'next/server';
import { db, day_entries, groups } from '@/db';
import { eq, and } from 'drizzle-orm';
import { getSessionFromRequest } from '@/lib/auth';
import { getTodaySubjects } from '@/lib/schedule';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'student' || !session.groupId) {
      return NextResponse.json({ error: 'Ikasle saioa beharrezkoa da' }, { status: 403 });
    }

    const body = await req.json();
    const today = new Date().toISOString().split('T')[0];

    // Check duplicate entry
    const [existing] = await db
      .select()
      .from(day_entries)
      .where(
        and(
          eq(day_entries.group_id, session.groupId),
          eq(day_entries.entry_date, today)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: 'Gaur dagoeneko sarrera bat dago' }, { status: 409 });
    }

    const fields = [
      'class_1_euskera', 'class_1_errespetua',
      'class_2_euskera', 'class_2_errespetua',
      'class_3_euskera', 'class_3_errespetua',
      'class_4_euskera', 'class_4_errespetua',
      'class_5_euskera', 'class_5_errespetua',
    ] as const;

    const boolValues: Record<string, boolean> = {};
    let trueCount = 0;
    for (const field of fields) {
      const val = Boolean(body[field]);
      boolValues[field] = val;
      if (val) trueCount++;
    }

    const subjects = getTodaySubjects();
    const maxPoints = subjects.length > 0 ? subjects.length * 2 : 10;
    const score = Math.round((trueCount / maxPoints) * 10);
    const advance = score / 2;

    const [entry] = await db
      .insert(day_entries)
      .values({
        group_id: session.groupId,
        entry_date: today,
        score,
        advance: String(advance),
        ...boolValues,
        validated_by_teacher: false,
      })
      .returning();

    // Update group position
    const [group] = await db.select().from(groups).where(eq(groups.id, session.groupId)).limit(1);
    if (group) {
      const currentPos = parseFloat(String(group.position));

      // Get classroom to get map_total
      const { classrooms } = await import('@/db');
      const [classroom] = await db
        .select()
        .from(classrooms)
        .where(eq(classrooms.id, group.classroom_id))
        .limit(1);

      const total = classroom?.map_total ?? 50;
      const newPos = Math.min(currentPos + advance, total);

      await db
        .update(groups)
        .set({ position: String(newPos) })
        .where(eq(groups.id, session.groupId));

      return NextResponse.json(
        { ...entry, previousPosition: currentPos, newPosition: newPos },
        { status: 201 }
      );
    }

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const groupId = req.nextUrl.searchParams.get('group_id');
    if (!groupId) {
      return NextResponse.json({ error: 'group_id beharrezkoa da' }, { status: 400 });
    }

    const entries = await db
      .select()
      .from(day_entries)
      .where(eq(day_entries.group_id, parseInt(groupId)))
      .orderBy(day_entries.entry_date);

    return NextResponse.json(entries);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}
