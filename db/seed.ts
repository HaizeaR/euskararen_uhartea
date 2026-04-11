import { db } from './index';
import { users, classrooms, groups, day_entries } from './schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { CHARACTER_COLORS } from '../lib/characters';

const GROUP_CODES = ['EKP001', 'EKP002', 'EKP003', 'EKP004', 'EKP005', 'EKP006'];
const GROUP_NAMES = ['1. Ekipoa', '2. Ekipoa', '3. Ekipoa', '4. Ekipoa', '5. Ekipoa', '6. Ekipoa'];

async function seed() {
  console.log('Seeding database...');

  // Create teacher
  const passwordHash = await bcrypt.hash('uhartea2025', 10);
  let [teacher] = await db
    .insert(users)
    .values({ username: 'irakaslea', password_hash: passwordHash, role: 'teacher' })
    .onConflictDoNothing()
    .returning();

  if (!teacher) {
    [teacher] = await db.select().from(users).where(eq(users.username, 'irakaslea'));
    console.log('Teacher already exists');
  } else {
    console.log('Created teacher:', teacher.username);
  }

  // Create classroom
  let [classroom] = await db
    .insert(classrooms)
    .values({ name: '6B Klasea', code: 'UHARTE', teacher_id: teacher.id, map_total: 50, is_active: true })
    .onConflictDoNothing()
    .returning();

  if (!classroom) {
    [classroom] = await db.select().from(classrooms).where(eq(classrooms.code, 'UHARTE'));
    console.log('Classroom already exists');
  } else {
    console.log('Created classroom:', classroom.name);
  }

  // Delete existing entries and groups to re-seed with codes
  const existingGroups = await db.select({ id: groups.id }).from(groups).where(eq(groups.classroom_id, classroom.id));
  for (const g of existingGroups) {
    await db.delete(day_entries).where(eq(day_entries.group_id, g.id));
  }
  await db.delete(groups).where(eq(groups.classroom_id, classroom.id));
  console.log('Cleared old groups');

  // Create 6 groups with codes and generic names
  const groupValues = Array.from({ length: 6 }, (_, i) => ({
    classroom_id: classroom.id,
    code: GROUP_CODES[i],
    name: GROUP_NAMES[i],
    character_index: i,
    color: CHARACTER_COLORS[i],
    position: '0',
  }));

  const created = await db.insert(groups).values(groupValues).returning();
  console.log(`\nCreated ${created.length} groups:`);
  created.forEach(g => console.log(`  ${g.name}  →  code: ${g.code}  color: ${g.color}`));
  console.log('\nSeed complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
