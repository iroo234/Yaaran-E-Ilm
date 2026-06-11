import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, classesTable, enrollmentsTable, tutorsTable } from "@workspace/db";
import {
  GetClassParams,
  EnrollInClassParams,
  ListClassesQueryParams,
  ListClassesResponse,
  GetClassResponse,
  EnrollInClassResponse,
  CreateClassBody,
  GetMyClassesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function buildClass(cls: typeof classesTable.$inferSelect) {
  const [tutor] = await db.select().from(usersTable).where(eq(usersTable.id, cls.tutorId));
  return {
    id: cls.id,
    title: cls.title,
    description: cls.description ?? null,
    subject: cls.subject ?? null,
    level: cls.level ?? null,
    tutorId: cls.tutorId,
    tutorName: tutor?.name ?? "Unknown",
    tutorAvatarUrl: tutor?.avatarUrl ?? null,
    schedule: cls.schedule ?? null,
    maxStudents: cls.maxStudents,
    enrolledCount: cls.enrolledCount,
    price: cls.price ?? null,
    isFree: cls.isFree === 1,
    status: cls.status as "open" | "full" | "closed",
    createdAt: cls.createdAt.toISOString(),
  };
}

router.get("/classes", async (req, res): Promise<void> => {
  const queryParams = ListClassesQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const { subject, level, tutorId } = queryParams.data;

  let query = db.select().from(classesTable).$dynamic();

  if (tutorId) {
    query = query.where(eq(classesTable.tutorId, tutorId));
  }

  const classes = await query;
  let filtered = classes;
  if (subject) filtered = filtered.filter(c => c.subject === subject);
  if (level) filtered = filtered.filter(c => c.level === level);

  const result = await Promise.all(filtered.map(buildClass));
  res.json(ListClassesResponse.parse(result));
});

router.post("/classes", async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || user.role !== "tutor") {
    res.status(403).json({ error: "Only tutors can create classes" });
    return;
  }

  const parsed = CreateClassBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [cls] = await db.insert(classesTable).values({
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    subject: parsed.data.subject ?? null,
    level: parsed.data.level ?? null,
    tutorId: userId,
    schedule: parsed.data.schedule ?? null,
    maxStudents: parsed.data.maxStudents,
    price: parsed.data.price ?? null,
    isFree: parsed.data.isFree ? 1 : 0,
    status: "open",
  }).returning();

  const result = await buildClass(cls);
  res.status(201).json(result);
});

router.get("/classes/:id", async (req, res): Promise<void> => {
  const params = GetClassParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, params.data.id));
  if (!cls) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  const result = await buildClass(cls);
  res.json(GetClassResponse.parse(result));
});

router.post("/classes/:id/enroll", async (req, res): Promise<void> => {
  const params = EnrollInClassParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, params.data.id));
  if (!cls) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  if (cls.status === "full" || cls.enrolledCount >= cls.maxStudents) {
    res.status(400).json({ error: "Class is full" });
    return;
  }

  const existing = await db.select().from(enrollmentsTable)
    .where(eq(enrollmentsTable.studentId, userId));
  const alreadyEnrolled = existing.find(e => e.classId === params.data.id);
  if (alreadyEnrolled) {
    res.status(400).json({ error: "Already enrolled" });
    return;
  }

  await db.insert(enrollmentsTable).values({
    studentId: userId,
    classId: params.data.id,
  });

  const newCount = cls.enrolledCount + 1;
  const newStatus = newCount >= cls.maxStudents ? "full" : "open";
  await db.update(classesTable).set({
    enrolledCount: newCount,
    status: newStatus,
  }).where(eq(classesTable.id, params.data.id));

  res.json(EnrollInClassResponse.parse({ message: "Enrolled successfully" }));
});

router.get("/my/classes", async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  let classes: (typeof classesTable.$inferSelect)[] = [];

  if (user.role === "tutor") {
    classes = await db.select().from(classesTable).where(eq(classesTable.tutorId, userId));
  } else {
    const enrollments = await db.select().from(enrollmentsTable)
      .where(eq(enrollmentsTable.studentId, userId));
    classes = await Promise.all(
      enrollments.map(async (e) => {
        const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, e.classId));
        return cls;
      })
    ).then(r => r.filter(Boolean) as (typeof classesTable.$inferSelect)[]);
  }

  const result = await Promise.all(classes.map(buildClass));
  res.json(GetMyClassesResponse.parse(result));
});

export default router;
