import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, tutorsTable, classesTable, enrollmentsTable } from "@workspace/db";

const router: IRouter = Router();

async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || user.isAdmin !== 1) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

router.get("/admin/stats", requireAdmin, async (req, res): Promise<void> => {
  const [totalUsers] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
  const [totalTutors] = await db.select({ count: sql<number>`count(*)::int` }).from(tutorsTable);
  const [pendingTutors] = await db.select({ count: sql<number>`count(*)::int` }).from(tutorsTable).where(eq(tutorsTable.isApproved, 0));
  const [approvedTutors] = await db.select({ count: sql<number>`count(*)::int` }).from(tutorsTable).where(eq(tutorsTable.isApproved, 1));
  const [totalClasses] = await db.select({ count: sql<number>`count(*)::int` }).from(classesTable);
  const [totalEnrollments] = await db.select({ count: sql<number>`count(*)::int` }).from(enrollmentsTable);

  res.json({
    totalUsers: totalUsers?.count ?? 0,
    totalTutors: totalTutors?.count ?? 0,
    pendingTutors: pendingTutors?.count ?? 0,
    approvedTutors: approvedTutors?.count ?? 0,
    totalClasses: totalClasses?.count ?? 0,
    totalEnrollments: totalEnrollments?.count ?? 0,
  });
});

router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const users = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    role: usersTable.role,
    isAdmin: usersTable.isAdmin,
    createdAt: usersTable.createdAt,
  }).from(usersTable).orderBy(usersTable.createdAt);

  res.json(users.map(u => ({
    ...u,
    isAdmin: u.isAdmin === 1,
    createdAt: u.createdAt.toISOString(),
  })));
});

router.get("/admin/tutors/pending", requireAdmin, async (req, res): Promise<void> => {
  const pending = await db.select().from(tutorsTable)
    .where(eq(tutorsTable.isApproved, 0))
    .orderBy(tutorsTable.createdAt);

  const result = await Promise.all(pending.map(async (tutor) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, tutor.userId));
    return {
      id: tutor.id,
      userId: tutor.userId,
      name: user?.name ?? "Unknown",
      email: user?.email ?? "",
      bio: tutor.bio ?? null,
      subject: tutor.subject ?? null,
      level: tutor.level ?? null,
      isApproved: false,
      createdAt: tutor.createdAt.toISOString(),
    };
  }));

  res.json(result);
});

router.get("/admin/tutors", requireAdmin, async (req, res): Promise<void> => {
  const all = await db.select().from(tutorsTable).orderBy(tutorsTable.createdAt);

  const result = await Promise.all(all.map(async (tutor) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, tutor.userId));
    return {
      id: tutor.id,
      userId: tutor.userId,
      name: user?.name ?? "Unknown",
      email: user?.email ?? "",
      bio: tutor.bio ?? null,
      subject: tutor.subject ?? null,
      level: tutor.level ?? null,
      isApproved: tutor.isApproved === 1,
      createdAt: tutor.createdAt.toISOString(),
    };
  }));

  res.json(result);
});

router.post("/admin/tutors/:id/approve", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [tutor] = await db.select().from(tutorsTable).where(eq(tutorsTable.id, id));
  if (!tutor) {
    res.status(404).json({ error: "Tutor not found" });
    return;
  }
  await db.update(tutorsTable).set({ isApproved: 1 }).where(eq(tutorsTable.id, id));
  res.json({ message: "Tutor approved" });
});

router.post("/admin/tutors/:id/reject", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [tutor] = await db.select().from(tutorsTable).where(eq(tutorsTable.id, id));
  if (!tutor) {
    res.status(404).json({ error: "Tutor not found" });
    return;
  }
  const userId = tutor.userId;
  await db.delete(tutorsTable).where(eq(tutorsTable.id, id));
  await db.update(usersTable).set({ role: "student" }).where(eq(usersTable.id, userId));
  res.json({ message: "Tutor application rejected" });
});

router.delete("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(tutorsTable).where(eq(tutorsTable.userId, id));
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ message: "User removed" });
});

export default router;
