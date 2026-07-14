import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  next();
}

router.patch("/profile/avatar", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const { avatarUrl } = req.body;
  if (!avatarUrl) { res.status(400).json({ error: "avatarUrl required" }); return; }
  await db.update(usersTable).set({ avatarUrl }).where(eq(usersTable.id, userId));
  res.json({ message: "Avatar updated", avatarUrl });
});

router.patch("/profile/phone", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const { phone } = req.body;
  if (!phone || !/^03\d{9}$/.test(phone)) { res.status(400).json({ error: "Enter a valid Pakistani number (03XXXXXXXXX)" }); return; }
  await db.update(usersTable).set({ phone }).where(eq(usersTable.id, userId));
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl ?? null, isAdmin: user.isAdmin === 1, phone: user.phone, createdAt: user.createdAt.toISOString() });
});

export default router;
