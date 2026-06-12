import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, availabilityTable, tutorsTable } from "@workspace/db";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  next();
}

router.get("/availability/:tutorUserId", async (req, res): Promise<void> => {
  const tutorUserId = parseInt(req.params.tutorUserId, 10);
  const slots = await db.select().from(availabilityTable).where(eq(availabilityTable.tutorId, tutorUserId));
  res.json(slots.map(s => ({ ...s, createdAt: s.createdAt.toISOString() })));
});

router.post("/availability", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const { dayOfWeek, startTime, endTime } = req.body;
  if (!dayOfWeek || !startTime || !endTime) { res.status(400).json({ error: "dayOfWeek, startTime, endTime required" }); return; }

  const [slot] = await db.insert(availabilityTable).values({ tutorId: userId, dayOfWeek, startTime, endTime }).returning();
  res.status(201).json({ ...slot, createdAt: slot.createdAt.toISOString() });
});

router.delete("/availability/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const id = parseInt(req.params.id, 10);
  await db.delete(availabilityTable).where(and(eq(availabilityTable.id, id), eq(availabilityTable.tutorId, userId)));
  res.json({ message: "Deleted" });
});

router.patch("/tutors/my/rate", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const { hourlyRate } = req.body;
  if (!hourlyRate) { res.status(400).json({ error: "hourlyRate required" }); return; }
  await db.update(tutorsTable).set({ hourlyRate }).where(eq(tutorsTable.userId, userId));
  res.json({ message: "Rate updated" });
});

export default router;
