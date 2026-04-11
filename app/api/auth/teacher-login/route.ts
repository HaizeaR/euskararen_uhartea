import { NextRequest, NextResponse } from 'next/server';
import { db, users, classrooms, groups } from '@/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { signJWT, setCookieToken } from '@/lib/auth';

const DEFAULT_TEACHER_USERNAME = 'irakaslea';
const DEFAULT_TEACHER_PASSWORD = 'uhartea2025';
const DEFAULT_CLASSROOM_CODE = 'UHARTE';
const DEFAULT_CLASSROOM_NAME = '6B Klasea';
const DEFAULT_GROUP_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

async function ensureDefaultData(teacherId: number) {
  const [existingClassroom] = await db
    .select()
    .from(classrooms)
    .where(eq(classrooms.teacher_id, teacherId))
    .limit(1);

  const classroom =
    existingClassroom ??
    (
      await db
        .insert(classrooms)
        .values({
          name: DEFAULT_CLASSROOM_NAME,
          code: DEFAULT_CLASSROOM_CODE,
          teacher_id: teacherId,
          map_total: 50,
          is_active: true,
        })
        .returning()
    )[0];

  const existingGroups = await db
    .select()
    .from(groups)
    .where(eq(groups.classroom_id, classroom.id));

  if (existingGroups.length === 0) {
    await db.insert(groups).values(
      Array.from({ length: 6 }, (_, i) => ({
        classroom_id: classroom.id,
        character_index: i,
        color: DEFAULT_GROUP_COLORS[i],
        position: '0',
      }))
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Eremu guztiak beharrezkoak dira' }, { status: 400 });
    }

    let [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (!user && username === DEFAULT_TEACHER_USERNAME && password === DEFAULT_TEACHER_PASSWORD) {
      const passwordHash = await bcrypt.hash(DEFAULT_TEACHER_PASSWORD, 10);
      [user] = await db
        .insert(users)
        .values({
          username: DEFAULT_TEACHER_USERNAME,
          password_hash: passwordHash,
          role: 'teacher',
        })
        .onConflictDoNothing()
        .returning();

      if (!user) {
        [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
      }
    }

    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Erabiltzaile edo pasahitz okerra' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Erabiltzaile edo pasahitz okerra' }, { status: 401 });
    }

    await ensureDefaultData(user.id);

    const token = await signJWT({ userId: user.id, role: 'teacher' });
    const { name, value, options } = setCookieToken(token);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Zerbitzari errorea' }, { status: 500 });
  }
}
