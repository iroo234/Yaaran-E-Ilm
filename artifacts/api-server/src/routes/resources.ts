import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, resourcesTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  next();
}

router.get("/resources", async (req, res): Promise<void> => {
  const { subject, level } = req.query as { subject?: string; level?: string };
  let resources = await db.select().from(resourcesTable);
  if (subject) resources = resources.filter(r => r.subject === subject);
  if (level) resources = resources.filter(r => r.level === level);

  const enriched = await Promise.all(resources.map(async (r) => {
    const [uploader] = await db.select({ name: usersTable.name, role: usersTable.role }).from(usersTable).where(eq(usersTable.id, r.uploaderId));
    return { ...r, createdAt: r.createdAt.toISOString(), uploaderName: uploader?.name ?? "Unknown", uploaderRole: uploader?.role ?? "student" };
  }));

  res.json(enriched.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

router.post("/resources", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const { title, description, fileUrl, fileType, subject, level } = req.body;
  if (!title || !fileUrl) { res.status(400).json({ error: "title and fileUrl required" }); return; }

  const [resource] = await db.insert(resourcesTable).values({
    uploaderId: userId,
    title,
    description: description ?? null,
    fileUrl,
    fileType: fileType ?? "pdf",
    subject: subject ?? null,
    level: level ?? null,
    downloads: 0,
  }).returning();

  res.status(201).json({ ...resource, createdAt: resource.createdAt.toISOString() });
});

router.delete("/resources/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const id = parseInt(req.params.id, 10);
  const [resource] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id));
  if (!resource) { res.status(404).json({ error: "Not found" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (resource.uploaderId !== userId && user?.isAdmin !== 1) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(resourcesTable).where(eq(resourcesTable.id, id));
  res.json({ message: "Deleted" });
});

export default router;
