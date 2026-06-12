import { Router, type IRouter } from "express";
import { eq, or, and, sql } from "drizzle-orm";
import { db, bookingsTable, usersTable, tutorsTable, notificationsTable, reviewsTable } from "@workspace/db";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

async function createNotification(userId: number, type: string, title: string, body: string, relatedId?: number) {
  await db.insert(notificationsTable).values({ userId, type, title, body, relatedId: relatedId ?? null });
}

router.post("/bookings", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const { tutorId, subject, message, date, timeSlot } = req.body;
  if (!tutorId || !subject || !date || !timeSlot) {
    res.status(400).json({ error: "tutorId, subject, date, timeSlot are required" });
    return;
  }
  const [tutor] = await db.select().from(tutorsTable).where(eq(tutorsTable.id, tutorId));
  if (!tutor) { res.status(404).json({ error: "Tutor not found" }); return; }

  const [booking] = await db.insert(bookingsTable).values({
    studentId: userId,
    tutorId: tutor.userId,
    subject,
    message: message ?? null,
    date,
    timeSlot,
    status: "pending",
    hourlyRate: tutor.hourlyRate,
  }).returning();

  const [student] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  await createNotification(tutor.userId, "booking_request", "New Booking Request", `${student?.name ?? "A student"} has requested a session on ${date} at ${timeSlot}.`, booking.id);

  res.status(201).json(booking);
});

router.get("/bookings/my", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  let bookings: any[];
  if (user.role === "tutor") {
    bookings = await db.select().from(bookingsTable).where(eq(bookingsTable.tutorId, userId));
  } else {
    bookings = await db.select().from(bookingsTable).where(eq(bookingsTable.studentId, userId));
  }

  const enriched = await Promise.all(bookings.map(async (b) => {
    const [student] = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, b.studentId));
    const [tutorUser] = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, b.tutorId));
    const [tutorProfile] = await db.select({ id: tutorsTable.id }).from(tutorsTable).where(eq(tutorsTable.userId, b.tutorId));
    const existingReview = b.status === "completed" ? await db.select().from(reviewsTable).where(eq(reviewsTable.bookingId, b.id)) : [];
    return {
      ...b,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      studentName: student?.name ?? "Unknown",
      studentEmail: student?.email ?? "",
      tutorName: tutorUser?.name ?? "Unknown",
      tutorProfileId: tutorProfile?.id ?? null,
      hasReview: existingReview.length > 0,
    };
  }));

  res.json(enriched);
});

router.post("/bookings/:id/accept", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const id = parseInt(req.params.id, 10);
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
  if (booking.tutorId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  if (booking.status !== "pending") { res.status(400).json({ error: "Booking is not pending" }); return; }

  const [updated] = await db.update(bookingsTable).set({ status: "confirmed", updatedAt: new Date() }).where(eq(bookingsTable.id, id)).returning();
  const [tutor] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  await createNotification(booking.studentId, "booking_confirmed", "Booking Confirmed!", `${tutor?.name ?? "Your tutor"} accepted your session on ${booking.date} at ${booking.timeSlot}.`, id);

  res.json(updated);
});

router.post("/bookings/:id/decline", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const id = parseInt(req.params.id, 10);
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
  if (booking.tutorId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  if (booking.status !== "pending") { res.status(400).json({ error: "Booking is not pending" }); return; }

  const [updated] = await db.update(bookingsTable).set({ status: "declined", updatedAt: new Date() }).where(eq(bookingsTable.id, id)).returning();
  const [tutor] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  await createNotification(booking.studentId, "booking_declined", "Booking Declined", `${tutor?.name ?? "Your tutor"} could not accept your session on ${booking.date}.`, id);

  res.json(updated);
});

router.post("/bookings/:id/complete", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const id = parseInt(req.params.id, 10);
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
  if (booking.studentId !== userId && booking.tutorId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  if (booking.status !== "confirmed") { res.status(400).json({ error: "Booking must be confirmed first" }); return; }

  const [updated] = await db.update(bookingsTable).set({ status: "completed", updatedAt: new Date() }).where(eq(bookingsTable.id, id)).returning();
  await createNotification(booking.studentId, "session_completed", "Session Completed", "Your session is marked complete. Please leave a review!", id);
  await createNotification(booking.tutorId, "session_completed", "Session Completed", "A session has been marked complete.", id);

  res.json(updated);
});

export default router;
