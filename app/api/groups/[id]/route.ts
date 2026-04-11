import { NextRequest, NextResponse } from 'next/server';
import { db, groups } from '@/db';
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
    const body = await req.json();

    const updateData: Partial<{ name: string; position: string }> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.position !== undefined) updateData.position = String(body.position);

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
