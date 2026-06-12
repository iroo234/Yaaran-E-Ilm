import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  next();
}

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, userId));
  res.json(notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 50)
    .map(n => ({ ...n, createdAt: n.createdAt.toISOString() })));
});

router.post("/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  await db.update(notificationsTable).set({ isRead: 1 }).where(
    and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, 0))
  );
  res.json({ message: "All marked read" });
});

router.post("/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.update(notificationsTable).set({ isRead: 1 }).where(eq(notificationsTable.id, id));
  res.json({ message: "Marked read" });
});

export default router;
