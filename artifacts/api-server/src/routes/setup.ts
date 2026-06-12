import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, setupConfigTable } from "@workspace/db";
import { createHash } from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "yaaran-e-ilm-salt").digest("hex");
}

async function isSetupEnabled(): Promise<boolean> {
  const [adminCount] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.isAdmin, 1));
  const count = adminCount?.count ?? 0;
  if (count >= 2) {
    // Check if manually enabled
    const [config] = await db.select().from(setupConfigTable).where(eq(setupConfigTable.key, "setup_enabled"));
    return config?.value === "true";
  }
  return true; // fewer than 2 admins — always open
}

router.get("/setup/status", async (req, res): Promise<void> => {
  const [adminCount] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.isAdmin, 1));
  const count = adminCount?.count ?? 0;
  const enabled = await isSetupEnabled();
  res.json({ adminExists: count > 0, adminCount: count, setupEnabled: enabled });
});

router.post("/setup/admin", async (req, res): Promise<void> => {
  const enabled = await isSetupEnabled();
  if (!enabled) {
    res.status(403).json({ error: "Setup is disabled. Max admin accounts reached or admin has disabled setup." });
    return;
  }

  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
  if (!name || name.trim().length < 2) { res.status(400).json({ error: "Name must be at least 2 characters" }); return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { res.status(400).json({ error: "Valid email is required" }); return; }
  if (!password || password.length < 8) { res.status(400).json({ error: "Password must be at least 8 characters" }); return; }

  const duplicate = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (duplicate.length > 0) { res.status(400).json({ error: "Email already registered" }); return; }

  const passwordHash = hashPassword(password);
  const [user] = await db.insert(usersTable).values({ name: name.trim(), email, passwordHash, role: "tutor", isAdmin: 1 }).returning();
  (req.session as any).userId = user.id;
  res.status(201).json({ id: user.id, name: user.name, email: user.email, isAdmin: true });
});

export default router;
