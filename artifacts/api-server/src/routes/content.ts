import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, siteContentTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = (req.session as any).userId;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || user.isAdmin !== 1) { res.status(403).json({ error: "Admin access required" }); return; }
  next();
}

const DEFAULT_CONTENT: Record<string, string> = {
  hero_title: "Yaaran E Ilm",
  hero_subtitle: "A free, peer-to-peer learning network where Pakistani students and tutors come together as friends — because knowledge shared is knowledge multiplied.",
  about_text: "Yaaran E Ilm was founded on a simple belief: that every Pakistani student deserves access to quality education regardless of their financial circumstances.",
  how_it_works: "Browse tutors, book a session, chat directly, and leave a review after your session.",
  footer_text: "Free always. For every student in Pakistan.",
  support_page_intro: "Yaaran E Ilm is a free platform providing quality education to every Pakistani student. We run on passion and community support.",
  support_page_payment: "JazzCash: 0325-7192449\nBank: Meezan Bank | Account: 01230123456789 | Title: M.Irfan Zaidi",
  support_page_contact_email: "Yaaraneilm@gmail.com",
  support_page_whatsapp: "+92 325 7192449",
};

router.get("/content", async (req, res): Promise<void> => {
  const rows = await db.select().from(siteContentTable);
  const content: Record<string, string> = { ...DEFAULT_CONTENT };
  rows.forEach(r => { content[r.key] = r.value; });
  res.json(content);
});

router.get("/content/:key", async (req, res): Promise<void> => {
  const key = req.params.key as string;
  const [row] = await db.select().from(siteContentTable).where(eq(siteContentTable.key, key));
  res.json({ key, value: row?.value ?? DEFAULT_CONTENT[key] ?? "" });
});

router.post("/content/:key", requireAdmin, async (req, res): Promise<void> => {
  const key = req.params.key as string;
  const { value } = req.body;
  if (value === undefined) { res.status(400).json({ error: "value required" }); return; }
  const existing = await db.select().from(siteContentTable).where(eq(siteContentTable.key, key));
  if (existing.length > 0) {
    await db.update(siteContentTable).set({ value, updatedAt: new Date() }).where(eq(siteContentTable.key, key));
  } else {
    await db.insert(siteContentTable).values({ key: key, value: value });
  }
  res.json({ key, value });
});

export default router;
