import { NextRequest, NextResponse } from 'next/server';
import { db, day_entries, groups, classrooms } from '@/db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
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

    const params   = req.nextUrl.searchParams;
    const groupId  = params.get('group_id');
    const dateFrom = params.get('from');
    const dateTo   = params.get('to');
    const format   = params.get('format'); // 'csv'

    // Fetch all groups for this classroom
    const classroomGroups = await db
      .select()
      .from(groups)
      .where(eq(groups.classroom_id, classroom.id));

    const groupIds = classroomGroups.map(g => g.id);
    if (groupIds.length === 0) return NextResponse.json([]);

    // Build query filters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filters: any[] = [];

    if (groupId) {
      const gid = parseInt(groupId);
      if (groupIds.includes(gid)) filters.push(eq(day_entries.group_id, gid));
      else return NextResponse.json([]);
    }

    if (dateFrom) filters.push(gte(day_entries.entry_date, dateFrom));
    if (dateTo)   filters.push(lte(day_entries.entry_date, dateTo));

    // Filter to only groups in this classroom
    const classroomGroupIds = groupIds;

    const rawEntries = await db
      .select()
      .from(day_entries)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(day_entries.entry_date), day_entries.group_id);

    // Filter by classroom ownership
    const entries = rawEntries.filter(e => classroomGroupIds.includes(e.group_id));

    // Attach group info
    const groupMap = Object.fromEntries(classroomGroups.map(g => [g.id, g]));
    const enriched = entries.map(e => ({
      ...e,
      group_name:  groupMap[e.group_id]?.name ?? `Taldea ${e.group_id}`,
      group_color: groupMap[e.group_id]?.color ?? '#888',
      character_index: groupMap[e.group_id]?.character_index ?? 0,
    }));

    // CSV export
    if (format === 'csv') {
      const CLASS_LABELS = ['Mat','Hiz','Nat','Giz','Gor'];
      const header = [
        'Taldea','Data','Puntuazioa','Aurreratua','Balioztatua',
        ...CLASS_LABELS.flatMap(l => [`${l}_Euskera`, `${l}_Errespetua`]),
      ].join(',');

      const rows = enriched.map(e => [
        `"${e.group_name}"`,
        e.entry_date,
        e.score,
        e.advance,
        e.validated_by_teacher ? 'Bai' : 'Ez',
        ...[1,2,3,4,5].flatMap(k => [
          (e as Record<string, unknown>)[`class_${k}_euskera`]    ? '1' : '0',
          (e as Record<string, unknown>)[`class_${k}_errespetua`] ? '1' : '0',
        ]),
      ].join(','));

      const csv = [header, ...rows].join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="historia-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(enriched);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}

// Validate a single entry
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Baimena beharrezkoa da' }, { status: 403 });
    }
    const { entryId } = await req.json();
    const [updated] = await db
      .update(day_entries)
      .set({ validated_by_teacher: true })
      .where(eq(day_entries.id, entryId))
      .returning();
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}
