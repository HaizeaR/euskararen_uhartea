import { NextRequest, NextResponse } from 'next/server';
import { db, group_members, groups, classrooms } from '@/db';
import { eq } from 'drizzle-orm';
import { getSessionFromRequest } from '@/lib/auth';

async function assertTeacherOwnsGroup(session: { role: string; userId?: number }, groupId: number) {
  if (session.role !== 'teacher' || !session.userId) return false;
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  if (!group) return false;
  const [classroom] = await db.select().from(classrooms).where(eq(classrooms.id, group.classroom_id)).limit(1);
  return classroom?.teacher_id === session.userId;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Baimena beharrezkoa da' }, { status: 403 });
    }
    const groupId = parseInt(params.id);
    const members = await db
      .select()
      .from(group_members)
      .where(eq(group_members.group_id, groupId))
      .orderBy(group_members.created_at);
    return NextResponse.json(members);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Baimena beharrezkoa da' }, { status: 403 });

    const groupId = parseInt(params.id);
    const ok = await assertTeacherOwnsGroup(session, groupId);
    if (!ok) return NextResponse.json({ error: 'Baimena ukatua' }, { status: 403 });

    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Izena beharrezkoa da' }, { status: 400 });
    }

    const [member] = await db
      .insert(group_members)
      .values({ group_id: groupId, name: name.trim().slice(0, 150) })
      .returning();

    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}
