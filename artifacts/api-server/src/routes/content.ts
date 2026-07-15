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

export const DEFAULT_CONTENT: Record<string, string> = {
  // Hero
  hero_badge: "Free. Forever. For every student.",
  hero_title: "Yaaran E Ilm",
  hero_subtitle: "A free, peer-to-peer learning network where Pakistani students and tutors come together as friends — because knowledge shared is knowledge multiplied.",
  hero_cta_student: "Join as Student",
  hero_cta_tutor: "Become a Tutor",

  // Stats section
  stats_students_boost: "200",
  stats_tutors_boost: "15",
  stats_classes_boost: "40",
  stats_students_label: "Students Helped",
  stats_tutors_label: "Tutors in the Team",
  stats_classes_label: "Classes Running",

  // How It Works
  hiw_heading: "Book a session in 4 easy steps",
  hiw_desc: "From browsing to your first session — it takes less than 2 minutes.",
  hiw_1_title: "Browse Tutors",
  hiw_1_desc: "Search tutors by subject, level, and rating. Read their bios and see their availability.",
  hiw_2_title: "Book a Session",
  hiw_2_desc: "Send a booking request with your preferred date and time. No payment needed upfront.",
  hiw_3_title: "Connect & Chat",
  hiw_3_desc: "Message your tutor directly on the platform. Confirm details and prepare for your session.",
  hiw_4_title: "Learn & Review",
  hiw_4_desc: "Attend your session, mark it complete, and leave an honest review for your tutor.",

  // Mission / About
  mission_badge: "Our Mission",
  mission_heading: "Education is not a privilege. It is a right.",
  mission_p1: "Yaaran E Ilm was founded on a simple belief: that every Pakistani student deserves access to quality education regardless of their financial circumstances.",
  mission_p2: "From O Levels to A Levels, Matric to FSC — whether you are in Karachi, Lahore, Peshawar or a small town, Yaaran E Ilm is your study hall.",
  mission_cta: "Be Part of the Mission",

  // Values card
  values_heading: "What we stand for",
  values_1_label: "Peer-to-peer learning",
  values_1_desc: "Students teach students, creating a cycle of knowledge and community.",
  values_2_label: "Completely free",
  values_2_desc: "Every class, every tutor, every session — no cost ever, to anyone.",
  values_3_label: "O/A Level focused",
  values_3_desc: "Specialized support for high-stakes Pakistani examinations.",
  values_4_label: "Direct booking system",
  values_4_desc: "Book sessions instantly with your tutor, no middlemen.",

  // Join section
  join_heading: "Find your place in Yaaran E Ilm",
  join_subtitle: "Whether you want to learn or teach — there is a place for you here.",
  student_card_heading: "Student",
  student_card_desc: "Get access to qualified tutors. Book one-on-one sessions and join classes. Learn for free.",
  student_bullet_1: "Book sessions directly with tutors",
  student_bullet_2: "Access study resources & notes",
  student_bullet_3: "All levels: O, A, Matric, FSC",
  tutor_card_heading: "Tutor",
  tutor_card_desc: "Share your knowledge. Set your own schedule. Help hundreds of students reach their potential.",
  tutor_bullet_1: "Manage bookings from your dashboard",
  tutor_bullet_2: "Set your availability and rate",
  tutor_bullet_3: "Build your profile and earn reviews",

  // Reviews section
  reviews_heading: "What our students say",
  reviews_subtitle: "Real words from real students whose journeys have been shaped by this community.",

  // CTA section
  cta_heading: "Ready to join the movement?",
  cta_desc: "Thousands of students are already learning for free. Your tutor is waiting. Your community is here.",

  // Footer
  footer_tagline: "Friends of Knowledge · یاران علم",
  footer_text: "Free always. For every student in Pakistan.",

  // Support Us page
  support_page_intro: "Yaaran E Ilm is a free platform providing quality education to every Pakistani student. We run on passion and community support.",
  support_page_payment: "JazzCash: 0325-7192449\nBank: Meezan Bank | Account: 01230123456789 | Title: M.Irfan Zaidi",
  support_page_contact_email: "Yaaraneilm@gmail.com",
  support_page_whatsapp: "+92 325 7192449",

  // About page
  about_text: "Yaaran E Ilm was founded on a simple belief: that every Pakistani student deserves access to quality education regardless of their financial circumstances.",
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
    await db.insert(siteContentTable).values({ key, value });
  }
  res.json({ key, value });
});

// Bulk save
router.post("/content", requireAdmin, async (req, res): Promise<void> => {
  const updates: Record<string, string> = req.body;
  if (!updates || typeof updates !== "object") { res.status(400).json({ error: "Expected object of key:value pairs" }); return; }
  for (const [key, value] of Object.entries(updates)) {
    const existing = await db.select().from(siteContentTable).where(eq(siteContentTable.key, key));
    if (existing.length > 0) {
      await db.update(siteContentTable).set({ value, updatedAt: new Date() }).where(eq(siteContentTable.key, key));
    } else {
      await db.insert(siteContentTable).values({ key, value });
    }
  }
  res.json({ saved: Object.keys(updates).length });
});

export default router;
