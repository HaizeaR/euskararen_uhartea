import { db } from './index';
import { users, classrooms, groups } from './schema';
import bcrypt from 'bcryptjs';

const GROUP_COLORS = [
  '#e74c3c', // rojo
  '#3498db', // azul
  '#2ecc71', // verde
  '#f39c12', // naranja
  '#9b59b6', // morado
  '#1abc9c', // turquesa
];

async function seed() {
  console.log('Seeding database...');

  // Create teacher user
  const passwordHash = await bcrypt.hash('uhartea2025', 10);
  const [teacher] = await db
    .insert(users)
    .values({
      username: 'irakaslea',
      password_hash: passwordHash,
      role: 'teacher',
    })
    .onConflictDoNothing()
    .returning();

  if (!teacher) {
    console.log('Teacher already exists, skipping...');
    return;
  }

  console.log('Created teacher:', teacher.username);

  // Create classroom
  const [classroom] = await db
    .insert(classrooms)
    .values({
      name: '6B Klasea',
      code: 'UHARTE',
      teacher_id: teacher.id,
      map_total: 50,
      is_active: true,
    })
    .onConflictDoNothing()
    .returning();

  if (!classroom) {
    console.log('Classroom already exists, skipping...');
    return;
  }

  console.log('Created classroom:', classroom.name);

  // Create 6 groups
  const groupValues = Array.from({ length: 6 }, (_, i) => ({
    classroom_id: classroom.id,
    character_index: i,
    color: GROUP_COLORS[i],
    position: '0',
  }));

  const createdGroups = await db
    .insert(groups)
    .values(groupValues)
    .returning();

  console.log(`Created ${createdGroups.length} groups`);
  console.log('Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
