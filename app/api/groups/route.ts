import { NextRequest, NextResponse } from 'next/server';
import { db, groups, classrooms } from '@/db';
import { eq } from 'drizzle-orm';
import { getSessionFromRequest } from '@/lib/auth';
import { CHARACTER_COLORS } from '@/lib/characters';

function generateCode(existing: string[]): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code: string;
  do {
    code = 'EKP' + Array.from({ length: 3 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  } while (existing.includes(code));
  return code;
}

export async function GET(req: NextRequest) {
  try {
    const classroomId = req.nextUrl.searchParams.get('classroom_id');
    if (!classroomId) {
      return NextResponse.json({ error: 'classroom_id beharrezkoa da' }, { status: 400 });
    }

    const groupList = await db
      .select()
      .from(groups)
      .where(eq(groups.classroom_id, parseInt(classroomId)));

    return NextResponse.json(groupList);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
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

    const existing = await db
      .select({ id: groups.id, code: groups.code })
      .from(groups)
      .where(eq(groups.classroom_id, classroom.id));

    const count        = existing.length;
    const existingCodes = existing.map(g => g.code).filter(Boolean) as string[];
    const code         = generateCode(existingCodes);
    const charIdx      = count % 6;

    const [newGroup] = await db
      .insert(groups)
      .values({
        classroom_id:    classroom.id,
        code,
        name:            `${count + 1}. Ekipoa`,
        character_index: charIdx,
        color:           CHARACTER_COLORS[charIdx],
        position:        '0',
      })
      .returning();

    return NextResponse.json(newGroup, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}
