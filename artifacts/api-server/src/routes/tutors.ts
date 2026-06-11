import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, tutorsTable, videosTable, classesTable } from "@workspace/db";
import {
  GetTutorParams,
  UpdateTutorParams,
  UpdateTutorBody,
  ListTutorsResponse,
  GetTutorResponse,
  UpdateTutorResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function buildTutor(userId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const [tutor] = await db.select().from(tutorsTable).where(eq(tutorsTable.userId, userId));
  if (!user || !tutor) return null;

  const [videoCount] = await db.select({ count: sql<number>`count(*)::int` }).from(videosTable).where(eq(videosTable.uploaderId, userId));
  const [classCount] = await db.select({ count: sql<number>`count(*)::int` }).from(classesTable).where(eq(classesTable.tutorId, userId));
  const [studentCount] = await db.select({ count: sql<number>`sum(enrolled_count)::int` }).from(classesTable).where(eq(classesTable.tutorId, userId));

  return {
    id: tutor.id,
    userId: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    bio: tutor.bio ?? null,
    subject: tutor.subject ?? null,
    level: tutor.level ?? null,
    rating: tutor.rating ?? null,
    totalStudents: studentCount?.count ?? 0,
    totalVideos: videoCount?.count ?? 0,
    totalClasses: classCount?.count ?? 0,
    createdAt: tutor.createdAt.toISOString(),
  };
}

router.get("/tutors", async (req, res): Promise<void> => {
  const { subject, level } = req.query as { subject?: string; level?: string };

  let query = db.select().from(tutorsTable)
    .where(eq(tutorsTable.isApproved, 1))
    .$dynamic();

  if (subject) {
    query = query.where(eq(tutorsTable.subject, subject));
  }

  const tutorRows = await query;
  const tutors = await Promise.all(tutorRows.map(t => buildTutor(t.userId)));
  const filtered = tutors.filter(Boolean);
  const levelFiltered = level ? filtered.filter(t => t!.level === level) : filtered;

  res.json(ListTutorsResponse.parse(levelFiltered));
});

router.get("/tutors/:id", async (req, res): Promise<void> => {
  const params = GetTutorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [tutor] = await db.select().from(tutorsTable).where(eq(tutorsTable.id, params.data.id));
  if (!tutor || tutor.isApproved !== 1) {
    res.status(404).json({ error: "Tutor not found" });
    return;
  }

  const tutorData = await buildTutor(tutor.userId);
  if (!tutorData) {
    res.status(404).json({ error: "Tutor not found" });
    return;
  }

  res.json(GetTutorResponse.parse(tutorData));
});

router.patch("/tutors/:id", async (req, res): Promise<void> => {
  const params = UpdateTutorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTutorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [tutor] = await db.select().from(tutorsTable).where(eq(tutorsTable.id, params.data.id));
  if (!tutor || tutor.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const updateData: Partial<typeof tutorsTable.$inferInsert> = {};
  if (parsed.data.bio !== undefined) updateData.bio = parsed.data.bio;
  if (parsed.data.subject !== undefined) updateData.subject = parsed.data.subject;
  if (parsed.data.level !== undefined) updateData.level = parsed.data.level;

  if (parsed.data.avatarUrl !== undefined) {
    await db.update(usersTable).set({ avatarUrl: parsed.data.avatarUrl }).where(eq(usersTable.id, userId));
  }

  await db.update(tutorsTable).set(updateData).where(eq(tutorsTable.id, params.data.id));

  const tutorData = await buildTutor(tutor.userId);
  res.json(UpdateTutorResponse.parse(tutorData));
});

export default router;
