import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tutorsTable = pgTable("tutors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  bio: text("bio"),
  subject: text("subject"),
  level: text("level"),
  rating: real("rating"),
  isApproved: integer("is_approved").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTutorSchema = createInsertSchema(tutorsTable).omit({ id: true, createdAt: true });
export type InsertTutor = z.infer<typeof insertTutorSchema>;
export type Tutor = typeof tutorsTable.$inferSelect;
