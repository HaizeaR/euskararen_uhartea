import { NextRequest, NextResponse } from 'next/server';
import { db, groups } from '@/db';
import { eq } from 'drizzle-orm';

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
