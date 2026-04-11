CREATE TYPE "public"."role" AS ENUM('teacher', 'student');--> statement-breakpoint
CREATE TABLE "classrooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(6) NOT NULL,
	"teacher_id" integer NOT NULL,
	"map_total" integer DEFAULT 50 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "classrooms_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "day_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"entry_date" date NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"advance" numeric(3, 1) DEFAULT '0' NOT NULL,
	"class_1_euskera" boolean DEFAULT false NOT NULL,
	"class_1_errespetua" boolean DEFAULT false NOT NULL,
	"class_2_euskera" boolean DEFAULT false NOT NULL,
	"class_2_errespetua" boolean DEFAULT false NOT NULL,
	"class_3_euskera" boolean DEFAULT false NOT NULL,
	"class_3_errespetua" boolean DEFAULT false NOT NULL,
	"class_4_euskera" boolean DEFAULT false NOT NULL,
	"class_4_errespetua" boolean DEFAULT false NOT NULL,
	"class_5_euskera" boolean DEFAULT false NOT NULL,
	"class_5_errespetua" boolean DEFAULT false NOT NULL,
	"validated_by_teacher" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"classroom_id" integer NOT NULL,
	"name" varchar(100),
	"character_index" integer DEFAULT 0 NOT NULL,
	"position" numeric(5, 1) DEFAULT '0' NOT NULL,
	"color" varchar(7) DEFAULT '#20b090' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_entries" ADD CONSTRAINT "day_entries_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE no action ON UPDATE no action;