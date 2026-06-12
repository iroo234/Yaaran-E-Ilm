import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { createHash } from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "yaaran-e-ilm-salt").digest("hex");
}

router.get("/setup/status", async (req, res): Promise<void> => {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(eq(usersTable.isAdmin, 1));
  res.json({ adminExists: (result?.count ?? 0) > 0 });
});

router.post("/setup/admin", async (req, res): Promise<void> => {
  const [existing] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(eq(usersTable.isAdmin, 1));

  if ((existing?.count ?? 0) > 0) {
    res.status(403).json({ error: "Admin already exists. Setup is disabled." });
    return;
  }

  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };

  if (!name || name.trim().length < 2) {
    res.status(400).json({ error: "Name must be at least 2 characters" });
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }
  if (!password || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const duplicate = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (duplicate.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = hashPassword(password);
  const [user] = await db
    .insert(usersTable)
    .values({ name: name.trim(), email, passwordHash, role: "tutor", isAdmin: 1 })
    .returning();

  (req.session as any).userId = user.id;

  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: true,
  });
});

export default router;
