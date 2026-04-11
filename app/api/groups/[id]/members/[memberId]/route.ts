import { NextRequest, NextResponse } from 'next/server';
import { db, group_members, groups, classrooms } from '@/db';
import { eq, and } from 'drizzle-orm';
import { getSessionFromRequest } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'teacher' || !session.userId) {
      return NextResponse.json({ error: 'Baimena beharrezkoa da' }, { status: 403 });
    }

    const groupId   = parseInt(params.id);
    const memberId  = parseInt(params.memberId);

    // Verify teacher owns this group
    const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    if (!group) return NextResponse.json({ error: 'Taldea ez da aurkitu' }, { status: 404 });

    const [classroom] = await db.select().from(classrooms).where(eq(classrooms.id, group.classroom_id)).limit(1);
    if (classroom?.teacher_id !== session.userId) {
      return NextResponse.json({ error: 'Baimena ukatua' }, { status: 403 });
    }

    await db
      .delete(group_members)
      .where(and(eq(group_members.id, memberId), eq(group_members.group_id, groupId)));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}
