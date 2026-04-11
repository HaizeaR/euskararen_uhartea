import { NextRequest, NextResponse } from 'next/server';
import { db, groups } from '@/db';
import { eq } from 'drizzle-orm';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(
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
      .update(groups)
      .set({ position: '0' })
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
