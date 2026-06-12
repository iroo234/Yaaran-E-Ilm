import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, usersTable, tutorsTable, classesTable, enrollmentsTable, bookingsTable, reviewsTable, setupConfigTable } from "@workspace/db";

const router: IRouter = Router();

async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = (req.session as any).userId;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || user.isAdmin !== 1) { res.status(403).json({ error: "Admin access required" }); return; }
  next();
}

router.get("/admin/stats", requireAdmin, async (req, res): Promise<void> => {
  const [totalUsers] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
  const [totalTutors] = await db.select({ count: sql<number>`count(*)::int` }).from(tutorsTable);
  const [pendingTutors] = await db.select({ count: sql<number>`count(*)::int` }).from(tutorsTable).where(eq(tutorsTable.isApproved, 0));
  const [approvedTutors] = await db.select({ count: sql<number>`count(*)::int` }).from(tutorsTable).where(eq(tutorsTable.isApproved, 1));
  const [totalClasses] = await db.select({ count: sql<number>`count(*)::int` }).from(classesTable);
  const [totalEnrollments] = await db.select({ count: sql<number>`count(*)::int` }).from(enrollmentsTable);
  const [totalBookings] = await db.select({ count: sql<number>`count(*)::int` }).from(bookingsTable);
  const [completedBookings] = await db.select({ count: sql<number>`count(*)::int` }).from(bookingsTable).where(eq(bookingsTable.status, "completed"));
  const [totalReviews] = await db.select({ count: sql<number>`count(*)::int` }).from(reviewsTable);
  const [adminCount] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.isAdmin, 1));

  res.json({
    totalUsers: totalUsers?.count ?? 0,
    totalTutors: totalTutors?.count ?? 0,
    pendingTutors: pendingTutors?.count ?? 0,
    approvedTutors: approvedTutors?.count ?? 0,
    totalClasses: totalClasses?.count ?? 0,
    totalEnrollments: totalEnrollments?.count ?? 0,
    totalBookings: totalBookings?.count ?? 0,
    completedSessions: completedBookings?.count ?? 0,
    totalReviews: totalReviews?.count ?? 0,
    adminCount: adminCount?.count ?? 0,
  });
});

router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const users = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, isAdmin: usersTable.isAdmin, createdAt: usersTable.createdAt }).from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(users.map(u => ({ ...u, isAdmin: u.isAdmin === 1, createdAt: u.createdAt.toISOString() })));
});

router.get("/admin/tutors/pending", requireAdmin, async (req, res): Promise<void> => {
  const pending = await db.select().from(tutorsTable).where(eq(tutorsTable.isApproved, 0)).orderBy(tutorsTable.createdAt);
  const result = await Promise.all(pending.map(async (tutor) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, tutor.userId));
    return { id: tutor.id, userId: tutor.userId, name: user?.name ?? "Unknown", email: user?.email ?? "", bio: tutor.bio ?? null, subject: tutor.subject ?? null, level: tutor.level ?? null, isApproved: false, createdAt: tutor.createdAt.toISOString() };
  }));
  res.json(result);
});

router.get("/admin/tutors", requireAdmin, async (req, res): Promise<void> => {
  const all = await db.select().from(tutorsTable).orderBy(tutorsTable.createdAt);
  const result = await Promise.all(all.map(async (tutor) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, tutor.userId));
    return { id: tutor.id, userId: tutor.userId, name: user?.name ?? "Unknown", email: user?.email ?? "", bio: tutor.bio ?? null, subject: tutor.subject ?? null, level: tutor.level ?? null, isApproved: tutor.isApproved === 1, hourlyRate: tutor.hourlyRate, createdAt: tutor.createdAt.toISOString() };
  }));
  res.json(result);
});

router.post("/admin/tutors/:id/approve", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [tutor] = await db.select().from(tutorsTable).where(eq(tutorsTable.id, id));
  if (!tutor) { res.status(404).json({ error: "Tutor not found" }); return; }
  await db.update(tutorsTable).set({ isApproved: 1 }).where(eq(tutorsTable.id, id));
  res.json({ message: "Tutor approved" });
});

router.post("/admin/tutors/:id/reject", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [tutor] = await db.select().from(tutorsTable).where(eq(tutorsTable.id, id));
  if (!tutor) { res.status(404).json({ error: "Tutor not found" }); return; }
  const userId = tutor.userId;
  await db.delete(tutorsTable).where(eq(tutorsTable.id, id));
  await db.update(usersTable).set({ role: "student" }).where(eq(usersTable.id, userId));
  res.json({ message: "Tutor application rejected" });
});

router.delete("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.delete(tutorsTable).where(eq(tutorsTable.userId, id));
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ message: "User removed" });
});

// Bookings management
router.get("/admin/bookings", requireAdmin, async (req, res): Promise<void> => {
  const bookings = await db.select().from(bookingsTable).orderBy(desc(bookingsTable.createdAt));
  const enriched = await Promise.all(bookings.map(async (b) => {
    const [student] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, b.studentId));
    const [tutor] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, b.tutorId));
    return { ...b, createdAt: b.createdAt.toISOString(), updatedAt: b.updatedAt.toISOString(), studentName: student?.name ?? "Unknown", tutorName: tutor?.name ?? "Unknown" };
  }));
  res.json(enriched);
});

// Reviews management
router.get("/admin/reviews", requireAdmin, async (req, res): Promise<void> => {
  const reviews = await db.select().from(reviewsTable).orderBy(desc(reviewsTable.createdAt));
  const enriched = await Promise.all(reviews.map(async (r) => {
    const [student] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, r.studentId));
    const [tutor] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, r.tutorId));
    return { ...r, createdAt: r.createdAt.toISOString(), studentName: student?.name ?? "Unknown", tutorName: tutor?.name ?? "Unknown" };
  }));
  res.json(enriched);
});

router.delete("/admin/reviews/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.delete(reviewsTable).where(eq(reviewsTable.id, id));
  res.json({ message: "Review deleted" });
});

// Admin management
router.get("/admin/admins", requireAdmin, async (req, res): Promise<void> => {
  const admins = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, createdAt: usersTable.createdAt }).from(usersTable).where(eq(usersTable.isAdmin, 1));
  res.json(admins.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })));
});

router.delete("/admin/admins/:id", requireAdmin, async (req, res): Promise<void> => {
  const myId = (req.session as any).userId;
  const id = parseInt(req.params.id, 10);
  if (id === myId) { res.status(400).json({ error: "Cannot remove yourself" }); return; }
  await db.update(usersTable).set({ isAdmin: 0 }).where(eq(usersTable.id, id));
  res.json({ message: "Admin removed" });
});

// Setup toggle
router.get("/admin/setup-toggle", requireAdmin, async (req, res): Promise<void> => {
  const [config] = await db.select().from(setupConfigTable).where(eq(setupConfigTable.key, "setup_enabled"));
  res.json({ enabled: config?.value === "true" });
});

router.post("/admin/setup-toggle", requireAdmin, async (req, res): Promise<void> => {
  const { enabled } = req.body;
  const existing = await db.select().from(setupConfigTable).where(eq(setupConfigTable.key, "setup_enabled"));
  if (existing.length > 0) {
    await db.update(setupConfigTable).set({ value: enabled ? "true" : "false", updatedAt: new Date() }).where(eq(setupConfigTable.key, "setup_enabled"));
  } else {
    await db.insert(setupConfigTable).values({ key: "setup_enabled", value: enabled ? "true" : "false" });
  }
  res.json({ message: "Setup toggle updated", enabled });
});

export default router;
