import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, videosTable, classesTable } from "@workspace/db";
import { GetPlatformStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  const [tutorCount] = await db.select({ count: sql<number>`count(*)::int` })
    .from(usersTable).where(eq(usersTable.role, "tutor"));
  const [studentCount] = await db.select({ count: sql<number>`count(*)::int` })
    .from(usersTable).where(eq(usersTable.role, "student"));
  const [videoCount] = await db.select({ count: sql<number>`count(*)::int` })
    .from(videosTable);
  const [classCount] = await db.select({ count: sql<number>`count(*)::int` })
    .from(classesTable);

  const subjectVideos = await db.select({
    subject: videosTable.subject,
    count: sql<number>`count(*)::int`,
  }).from(videosTable)
    .groupBy(videosTable.subject);

  const levelVideos = await db.select({
    level: videosTable.level,
    count: sql<number>`count(*)::int`,
  }).from(videosTable)
    .groupBy(videosTable.level);

  res.json(GetPlatformStatsResponse.parse({
    totalTutors: tutorCount?.count ?? 0,
    totalStudents: studentCount?.count ?? 0,
    totalVideos: videoCount?.count ?? 0,
    totalClasses: classCount?.count ?? 0,
    subjectBreakdown: subjectVideos
      .filter(r => r.subject)
      .map(r => ({ subject: r.subject!, count: r.count })),
    levelBreakdown: levelVideos
      .filter(r => r.level)
      .map(r => ({ level: r.level!, count: r.count })),
  }));
});

export default router;
