import { NextRequest, NextResponse } from 'next/server';
import { db, groups, classrooms } from '@/db';
import { eq, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

// POST /api/teacher/messages
// body: { groupId: number | 'all', message: string }
// Sets pending_message on one group or all groups in the classroom.
export async function POST(req: NextRequest) {
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

    const { groupId, message } = await req.json();
    const text = typeof message === 'string' ? message.trim().slice(0, 500) : '';
    if (!text) {
      return NextResponse.json({ error: 'Mezua ezin da hutsa izan' }, { status: 400 });
    }

    // Get groups that belong to this classroom
    const classroomGroups = await db
      .select({ id: groups.id })
      .from(groups)
      .where(eq(groups.classroom_id, classroom.id));

    const groupIds = classroomGroups.map(g => g.id);
    if (groupIds.length === 0) {
      return NextResponse.json({ error: 'Ez dago talderik' }, { status: 404 });
    }

    let targetIds: number[];
    if (groupId === 'all') {
      targetIds = groupIds;
    } else {
      const gid = parseInt(groupId);
      if (!groupIds.includes(gid)) {
        return NextResponse.json({ error: 'Taldea ez da aurkitu' }, { status: 404 });
      }
      targetIds = [gid];
    }

    await db
      .update(groups)
      .set({ pending_message: text })
      .where(inArray(groups.id, targetIds));

    return NextResponse.json({ ok: true, sent: targetIds.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}

// DELETE /api/teacher/messages?group_id=X  — teacher clears a message
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher' || !session.userId) {
      return NextResponse.json({ error: 'Baimena beharrezkoa da' }, { status: 403 });
    }

    const groupId = req.nextUrl.searchParams.get('group_id');
    if (!groupId) return NextResponse.json({ error: 'group_id beharrezkoa da' }, { status: 400 });

    await db
      .update(groups)
      .set({ pending_message: null })
      .where(eq(groups.id, parseInt(groupId)));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}
