import { Router, type IRouter } from "express";
import { eq, avg } from "drizzle-orm";
import { db, reviewsTable, bookingsTable, tutorsTable, usersTable, notificationsTable } from "@workspace/db";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  next();
}

router.post("/reviews", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const { bookingId, rating, comment } = req.body;
  if (!bookingId || !rating) { res.status(400).json({ error: "bookingId and rating required" }); return; }
  if (rating < 1 || rating > 5) { res.status(400).json({ error: "Rating must be 1-5" }); return; }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
  if (booking.studentId !== userId) { res.status(403).json({ error: "Only the student can review" }); return; }
  if (booking.status !== "completed") { res.status(400).json({ error: "Session must be completed first" }); return; }

  const existing = await db.select().from(reviewsTable).where(eq(reviewsTable.bookingId, bookingId));
  if (existing.length > 0) { res.status(400).json({ error: "Already reviewed" }); return; }

  const [review] = await db.insert(reviewsTable).values({
    bookingId,
    studentId: userId,
    tutorId: booking.tutorId,
    rating,
    comment: comment ?? null,
  }).returning();

  // Update tutor avg rating
  const [avgResult] = await db.select({ avg: avg(reviewsTable.rating) }).from(reviewsTable).where(eq(reviewsTable.tutorId, booking.tutorId));
  if (avgResult?.avg) {
    await db.update(tutorsTable).set({ rating: parseFloat(String(avgResult.avg)) }).where(eq(tutorsTable.userId, booking.tutorId));
  }
  await db.update(bookingsTable).set({ status: "reviewed", updatedAt: new Date() }).where(eq(bookingsTable.id, bookingId));

  // Notify tutor
  const [student] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  await db.insert(notificationsTable).values({ userId: booking.tutorId, type: "new_review", title: "New Review", body: `${student?.name ?? "A student"} left you a ${rating}-star review.`, relatedId: review.id });

  res.status(201).json({ ...review, createdAt: review.createdAt.toISOString() });
});

router.get("/reviews/tutor/:tutorUserId", async (req, res): Promise<void> => {
  const tutorUserId = parseInt(req.params.tutorUserId, 10);
  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.tutorId, tutorUserId));
  const enriched = await Promise.all(reviews.map(async (r) => {
    const [student] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, r.studentId));
    return { ...r, createdAt: r.createdAt.toISOString(), studentName: student?.name ?? "Anonymous" };
  }));
  res.json(enriched);
});

export default router;
