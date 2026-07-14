import { Router, type IRouter } from "express";
import { eq, avg } from "drizzle-orm";
import { db, reviewsTable, tutorsTable, usersTable, notificationsTable } from "@workspace/db";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  next();
}

// Post a review for any tutor (no booking required — open review system)
router.post("/reviews", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const { tutorUserId, rating, comment } = req.body;
  if (!tutorUserId || !rating) { res.status(400).json({ error: "tutorUserId and rating required" }); return; }
  if (rating < 1 || rating > 5) { res.status(400).json({ error: "Rating must be 1-5" }); return; }
  if (userId === tutorUserId) { res.status(400).json({ error: "You cannot review yourself" }); return; }

  // Check if user already reviewed this tutor
  const existing = await db.select().from(reviewsTable).where(eq(reviewsTable.studentId, userId)).then(rows => rows.filter(r => r.tutorId === tutorUserId));
  if (existing.length > 0) { res.status(400).json({ error: "You have already reviewed this tutor" }); return; }

  const [tutor] = await db.select().from(tutorsTable).where(eq(tutorsTable.userId, tutorUserId));
  if (!tutor) { res.status(404).json({ error: "Tutor not found" }); return; }

  const [review] = await db.insert(reviewsTable).values({
    bookingId: null as any,
    studentId: userId,
    tutorId: tutorUserId,
    rating,
    comment: comment ?? null,
  }).returning();

  // Update tutor avg rating
  const [avgResult] = await db.select({ avg: avg(reviewsTable.rating) }).from(reviewsTable).where(eq(reviewsTable.tutorId, tutorUserId));
  if (avgResult?.avg) {
    await db.update(tutorsTable).set({ rating: parseFloat(String(avgResult.avg)) }).where(eq(tutorsTable.userId, tutorUserId));
  }

  const [student] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  await db.insert(notificationsTable).values({ userId: tutorUserId, type: "new_review", title: "New Review ⭐", body: `${student?.name ?? "A student"} left you a ${rating}-star review.`, relatedId: review.id });

  res.status(201).json({ ...review, createdAt: review.createdAt.toISOString() });
});

router.get("/reviews/tutor/:tutorUserId", async (req, res): Promise<void> => {
  const tutorUserId = parseInt(req.params.tutorUserId as string, 10);
  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.tutorId, tutorUserId));
  const enriched = await Promise.all(reviews.map(async (r) => {
    const [student] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, r.studentId));
    return { ...r, createdAt: r.createdAt.toISOString(), studentName: student?.name ?? "Anonymous" };
  }));
  res.json(enriched.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

export default router;
