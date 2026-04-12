import { NextRequest, NextResponse } from 'next/server';
import { db, groups } from '@/db';
import { eq } from 'drizzle-orm';
import { getSessionFromRequest } from '@/lib/auth';

// PATCH /api/groups/message  — student dismisses (clears) their pending message
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'student' || !session.groupId) {
      return NextResponse.json({ error: 'Ikasle saioa beharrezkoa da' }, { status: 403 });
    }

    await db
      .update(groups)
      .set({ pending_message: null })
      .where(eq(groups.id, session.groupId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}
