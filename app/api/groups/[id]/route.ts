import { NextRequest, NextResponse } from 'next/server';
import { db, groups } from '@/db';
import { eq } from 'drizzle-orm';
import { getSessionFromRequest } from '@/lib/auth';
import { CHARACTER_COLORS } from '@/lib/characters';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Baimena beharrezkoa da' }, { status: 403 });
    }

    const id = parseInt(params.id);
    const body = await req.json();

    type GroupUpdate = Partial<{
      name: string;
      student_name: string;
      position: string;
      character_index: number;
      color: string;
    }>;

    const updateData: GroupUpdate = {};

    if (session.role === 'teacher') {
      // Teacher can update name, student_name, position, character
      if (body.name         !== undefined) updateData.name         = body.name;
      if (body.student_name !== undefined) updateData.student_name = body.student_name?.trim() || null;
      if (body.position     !== undefined) updateData.position     = String(body.position);
      if (body.character_index !== undefined) {
        const idx = parseInt(body.character_index);
        if (idx >= 0 && idx <= 5) {
          updateData.character_index = idx;
          updateData.color           = CHARACTER_COLORS[idx];
        }
      }
    } else if (session.role === 'student' && session.groupId === id) {
      // Student can only set their own student_name and character_index
      if (body.student_name !== undefined) {
        updateData.student_name = body.student_name?.trim().slice(0, 100) || null;
      }
      if (body.character_index !== undefined) {
        const idx = parseInt(body.character_index);
        if (idx >= 0 && idx <= 5) {
          updateData.character_index = idx;
          updateData.color           = CHARACTER_COLORS[idx];
        }
      }
    } else {
      return NextResponse.json({ error: 'Baimena ukatua' }, { status: 403 });
    }

    const [updated] = await db
      .update(groups)
      .set(updateData)
      .where(eq(groups.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Taldea ez da aurkitu' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}
