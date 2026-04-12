import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  boolean,
  date,
  numeric,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['teacher', 'student']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  role: roleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const classrooms = pgTable('classrooms', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 6 }).notNull().unique(),
  teacher_id: integer('teacher_id').notNull().references(() => users.id),
  map_total: integer('map_total').default(50).notNull(),
  class_names: varchar('class_names', { length: 500 }),   // JSON array of 5 strings
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const groups = pgTable('groups', {
  id: serial('id').primaryKey(),
  classroom_id: integer('classroom_id').notNull().references(() => classrooms.id),
  code: varchar('code', { length: 8 }).unique(),
  name: varchar('name', { length: 100 }),
  student_name: varchar('student_name', { length: 100 }),
  character_index: integer('character_index').notNull().default(0),
  position: numeric('position', { precision: 5, scale: 1 }).notNull().default('0'),
  color: varchar('color', { length: 7 }).notNull().default('#20b090'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const group_members = pgTable('group_members', {
  id:         serial('id').primaryKey(),
  group_id:   integer('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  name:       varchar('name', { length: 150 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const day_entries = pgTable('day_entries', {
  id: serial('id').primaryKey(),
  group_id: integer('group_id').notNull().references(() => groups.id),
  entry_date: date('entry_date').notNull(),
  score: integer('score').notNull().default(0),
  advance: numeric('advance', { precision: 3, scale: 1 }).notNull().default('0'),
  class_1_euskera: boolean('class_1_euskera').notNull().default(false),
  class_1_errespetua: boolean('class_1_errespetua').notNull().default(false),
  class_2_euskera: boolean('class_2_euskera').notNull().default(false),
  class_2_errespetua: boolean('class_2_errespetua').notNull().default(false),
  class_3_euskera: boolean('class_3_euskera').notNull().default(false),
  class_3_errespetua: boolean('class_3_errespetua').notNull().default(false),
  class_4_euskera: boolean('class_4_euskera').notNull().default(false),
  class_4_errespetua: boolean('class_4_errespetua').notNull().default(false),
  class_5_euskera: boolean('class_5_euskera').notNull().default(false),
  class_5_errespetua: boolean('class_5_errespetua').notNull().default(false),
  validated_by_teacher: boolean('validated_by_teacher').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type User         = typeof users.$inferSelect;
export type Classroom    = typeof classrooms.$inferSelect;
export type Group        = typeof groups.$inferSelect;
export type GroupMember  = typeof group_members.$inferSelect;
export type DayEntry     = typeof day_entries.$inferSelect;
