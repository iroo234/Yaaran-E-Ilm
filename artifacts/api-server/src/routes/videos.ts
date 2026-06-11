import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, usersTable, videosTable } from "@workspace/db";
import {
  GetVideoParams,
  DeleteVideoParams,
  ListVideosQueryParams,
  ListVideosResponse,
  GetFeaturedVideosResponse,
  GetVideoResponse,
  DeleteVideoResponse,
  CreateVideoBody,
  GetMyVideosResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function buildVideo(video: typeof videosTable.$inferSelect) {
  const [uploader] = await db.select().from(usersTable).where(eq(usersTable.id, video.uploaderId));
  return {
    id: video.id,
    title: video.title,
    description: video.description ?? null,
    videoUrl: video.videoUrl,
    thumbnailUrl: video.thumbnailUrl ?? null,
    subject: video.subject ?? null,
    level: video.level ?? null,
    duration: video.duration ?? null,
    views: video.views,
    uploaderId: video.uploaderId,
    uploaderName: uploader?.name ?? "Unknown",
    uploaderRole: uploader?.role ?? "student",
    createdAt: video.createdAt.toISOString(),
  };
}

router.get("/videos/featured", async (_req, res): Promise<void> => {
  const videos = await db.select().from(videosTable)
    .orderBy(desc(videosTable.views))
    .limit(8);
  const result = await Promise.all(videos.map(buildVideo));
  res.json(GetFeaturedVideosResponse.parse(result));
});

router.get("/my/videos", async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const videos = await db.select().from(videosTable)
    .where(eq(videosTable.uploaderId, userId))
    .orderBy(desc(videosTable.createdAt));
  const result = await Promise.all(videos.map(buildVideo));
  res.json(GetMyVideosResponse.parse(result));
});

router.get("/videos", async (req, res): Promise<void> => {
  const queryParams = ListVideosQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const { subject, level, uploaderId } = queryParams.data;

  let query = db.select().from(videosTable).$dynamic();

  if (uploaderId) {
    query = query.where(eq(videosTable.uploaderId, uploaderId));
  }

  const videos = await query.orderBy(desc(videosTable.createdAt));

  let filtered = videos;
  if (subject) filtered = filtered.filter(v => v.subject === subject);
  if (level) filtered = filtered.filter(v => v.level === level);

  const result = await Promise.all(filtered.map(buildVideo));
  res.json(ListVideosResponse.parse(result));
});

router.post("/videos", async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = CreateVideoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [video] = await db.insert(videosTable).values({
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    videoUrl: parsed.data.videoUrl,
    thumbnailUrl: parsed.data.thumbnailUrl ?? null,
    subject: parsed.data.subject ?? null,
    level: parsed.data.level ?? null,
    duration: parsed.data.duration ?? null,
    uploaderId: userId,
  }).returning();

  const result = await buildVideo(video);
  res.status(201).json(result);
});

router.get("/videos/:id", async (req, res): Promise<void> => {
  const params = GetVideoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, params.data.id));
  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  await db.update(videosTable)
    .set({ views: sql`${videosTable.views} + 1` })
    .where(eq(videosTable.id, params.data.id));

  const result = await buildVideo({ ...video, views: video.views + 1 });
  res.json(GetVideoResponse.parse(result));
});

router.delete("/videos/:id", async (req, res): Promise<void> => {
  const params = DeleteVideoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, params.data.id));
  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  if (video.uploaderId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(videosTable).where(eq(videosTable.id, params.data.id));
  res.json(DeleteVideoResponse.parse({ message: "Video deleted" }));
});

export default router;
