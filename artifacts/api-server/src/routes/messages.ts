import { Router, type IRouter } from "express";
import { eq, or, and } from "drizzle-orm";
import { db, messagesTable, usersTable, notificationsTable } from "@workspace/db";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  next();
}

router.get("/messages/conversations", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const msgs = await db.select().from(messagesTable).where(
    or(eq(messagesTable.senderId, userId), eq(messagesTable.receiverId, userId))
  );

  const partnerIds = new Set<number>();
  msgs.forEach(m => {
    if (m.senderId !== userId) partnerIds.add(m.senderId);
    if (m.receiverId !== userId) partnerIds.add(m.receiverId);
  });

  const conversations = await Promise.all(Array.from(partnerIds).map(async (partnerId) => {
    const [partner] = await db.select({ id: usersTable.id, name: usersTable.name, role: usersTable.role, avatarUrl: usersTable.avatarUrl }).from(usersTable).where(eq(usersTable.id, partnerId));
    const thread = msgs.filter(m => (m.senderId === partnerId || m.receiverId === partnerId));
    const last = thread.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    const unread = thread.filter(m => m.receiverId === userId && m.isRead === 0).length;
    return {
      partnerId,
      partnerName: partner?.name ?? "Unknown",
      partnerRole: partner?.role ?? "student",
      partnerAvatar: partner?.avatarUrl ?? null,
      lastMessage: last?.content ?? "",
      lastAt: last?.createdAt.toISOString() ?? "",
      unread,
    };
  }));

  res.json(conversations.sort((a, b) => b.lastAt.localeCompare(a.lastAt)));
});

router.get("/messages/:partnerId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const partnerId = parseInt(req.params.partnerId, 10);

  const msgs = await db.select().from(messagesTable).where(
    or(
      and(eq(messagesTable.senderId, userId), eq(messagesTable.receiverId, partnerId)),
      and(eq(messagesTable.senderId, partnerId), eq(messagesTable.receiverId, userId))
    )
  );

  await db.update(messagesTable).set({ isRead: 1 }).where(
    and(eq(messagesTable.senderId, partnerId), eq(messagesTable.receiverId, userId), eq(messagesTable.isRead, 0))
  );

  res.json(msgs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).map(m => ({
    ...m, createdAt: m.createdAt.toISOString()
  })));
});

router.post("/messages", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const { receiverId, content } = req.body;
  if (!receiverId || !content?.trim()) { res.status(400).json({ error: "receiverId and content required" }); return; }

  const [msg] = await db.insert(messagesTable).values({ senderId: userId, receiverId, content: content.trim(), isRead: 0 }).returning();

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  await db.insert(notificationsTable).values({ userId: receiverId, type: "new_message", title: "New Message 💬", body: `${sender?.name ?? "Someone"} sent you a message.`, relatedId: msg.id });

  res.status(201).json({ ...msg, createdAt: msg.createdAt.toISOString() });
});

// Delete entire conversation between current user and a partner
router.delete("/messages/conversation/:partnerId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const partnerId = parseInt(req.params.partnerId, 10);
  if (isNaN(partnerId)) { res.status(400).json({ error: "Invalid partnerId" }); return; }

  await db.delete(messagesTable).where(
    or(
      and(eq(messagesTable.senderId, userId), eq(messagesTable.receiverId, partnerId)),
      and(eq(messagesTable.senderId, partnerId), eq(messagesTable.receiverId, userId))
    )
  );
  res.json({ success: true });
});

export default router;
