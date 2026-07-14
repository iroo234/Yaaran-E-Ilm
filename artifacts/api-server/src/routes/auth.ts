import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, tutorsTable, notificationsTable } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { createHash } from "crypto";
import bcrypt from "bcrypt";

const router: IRouter = Router();
const BCRYPT_ROUNDS = 10;

function sha256Hash(password: string): string {
  return createHash("sha256").update(password + "yaaran-e-ilm-salt").digest("hex");
}

function buildUserResponse(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    isAdmin: user.isAdmin === 1,
    phone: user.phone ?? null,
    grade: user.grade ?? null,
    age: user.age ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password, role, bio, subject, level } = parsed.data;
  const { phone, grade, age } = req.body as { phone?: string; grade?: string; age?: number };

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  if (phone && !/^03\d{9}$/.test(phone)) {
    res.status(400).json({ error: "Phone must be in Pakistani format (03XXXXXXXXX, 11 digits)" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const [user] = await db.insert(usersTable).values({
    name,
    email,
    passwordHash,
    role,
    phone: phone ?? null,
    grade: grade ?? null,
    age: age ?? null,
  }).returning();

  if (role === "tutor") {
    await db.insert(tutorsTable).values({
      userId: user.id,
      bio: bio ?? null,
      subject: subject ?? null,
      level: level ?? null,
      isApproved: 0,
    });
  }

  (req.session as any).userId = user.id;
  res.status(201).json(buildUserResponse(user));
});

// Dual-path login with bcrypt upgrade + phone prompt for tutors
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  let passwordValid = false;
  const isBcrypt = user.passwordHash.startsWith("$2");
  if (isBcrypt) {
    passwordValid = await bcrypt.compare(password, user.passwordHash);
  } else {
    const sha256 = sha256Hash(password);
    if (user.passwordHash === sha256) {
      passwordValid = true;
      const newHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, user.id));
    }
  }

  if (!passwordValid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  (req.session as any).userId = user.id;

  // For tutors without a phone number — signal frontend to prompt
  if (user.role === "tutor" && !user.phone) {
    res.json({ ...buildUserResponse(user), needsPhone: true });
    return;
  }

  res.json(buildUserResponse(user));
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json(buildUserResponse(user));
});

export default router;
