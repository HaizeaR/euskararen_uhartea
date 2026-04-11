import { NextRequest, NextResponse } from 'next/server';
import { db, day_entries } from '@/db';
import { eq } from 'drizzle-orm';
import { getSessionFromRequest } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Baimena beharrezkoa da' }, { status: 403 });
    }

    const id = parseInt(params.id);

    const [updated] = await db
      .update(day_entries)
      .set({ validated_by_teacher: true })
      .where(eq(day_entries.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Sarrera ez da aurkitu' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}
