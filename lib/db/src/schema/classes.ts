import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const classesTable = pgTable("classes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  subject: text("subject"),
  level: text("level"),
  tutorId: integer("tutor_id").notNull(),
  schedule: text("schedule"),
  maxStudents: integer("max_students").notNull().default(30),
  enrolledCount: integer("enrolled_count").notNull().default(0),
  price: real("price"),
  isFree: integer("is_free").notNull().default(1),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertClassSchema = createInsertSchema(classesTable).omit({ id: true, createdAt: true, enrolledCount: true });
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classesTable.$inferSelect;
