import { useState, useEffect, useRef } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageSquare, ArrowLeft, Search, Trash2, X, MoreVertical, CheckCheck } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Error" })); throw new Error(e.error ?? "Request failed"); }
  return res.json();
}

type Conversation = { partnerId: number; partnerName: string; partnerRole: string; partnerAvatar?: string; lastMessage: string; lastAt: string; unread: number; };
type Message = { id: number; senderId: number; receiverId: number; content: string; isRead: number; createdAt: string; };

function timeAgo(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return d.toLocaleDateString("en-PK", { weekday: "short" });
  return d.toLocaleDateString("en-PK", { month: "short", day: "numeric" });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
}

function formatDateHeader(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (msgDate.getTime() === today.getTime()) return "Today";
  if (msgDate.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-PK", { weekday: "long", month: "long", day: "numeric" });
}

// Deterministic avatar color from name
const AVATAR_COLORS = ["bg-pink-200 text-pink-800", "bg-rose-200 text-rose-800", "bg-amber-200 text-amber-800", "bg-emerald-200 text-emerald-800", "bg-sky-200 text-sky-800", "bg-violet-200 text-violet-800"];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function Messages() {
  const { data: user } = useGetMe();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialWith = params.get("with") ? parseInt(params.get("with")!) : null;

  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(initialWith);
  const [text, setText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: () => apiFetch("/api/messages/conversations"),
    enabled: !!user,
    refetchInterval: 4000,
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["messages", selectedPartnerId],
    queryFn: () => apiFetch(`/api/messages/${selectedPartnerId}`),
    enabled: !!selectedPartnerId && !!user,
    refetchInterval: 2500,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => apiFetch("/api/messages", { method: "POST", body: JSON.stringify({ receiverId: selectedPartnerId, content }) }),
    onSuccess: () => { setText(""); qc.invalidateQueries({ queryKey: ["messages", selectedPartnerId] }); qc.invalidateQueries({ queryKey: ["conversations"] }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Failed to send", description: e.message }),
  });

  const deleteConvMutation = useMutation({
    mutationFn: (partnerId: number) => apiFetch(`/api/messages/conversation/${partnerId}`, { method: "DELETE" }),
    onSuccess: (_, partnerId) => {
      toast({ title: "Conversation deleted" });
      if (selectedPartnerId === partnerId) setSelectedPartnerId(null);
      setShowDeleteConfirm(null);
      setShowHeaderMenu(false);
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["messages", partnerId] });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (selectedPartnerId) { inputRef.current?.focus(); setShowHeaderMenu(false); } }, [selectedPartnerId]);

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <MessageSquare className="w-10 h-10 text-muted-foreground/40" />
      <p className="text-muted-foreground">Please log in to view messages.</p>
      <Link href="/login"><Button className="bg-accent text-accent-foreground">Log in</Button></Link>
    </div>
  );

  const userId = (user as any).id;
  const selectedConv = conversations.find(c => c.partnerId === selectedPartnerId);
  const filteredConvs = conversations.filter(c =>
    c.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  const handleSend = () => { if (text.trim() && !sendMutation.isPending) sendMutation.mutate(text.trim()); };

  // Group messages by date
  const groupedMessages: { date: string; msgs: Message[] }[] = [];
  messages.forEach(msg => {
    const d = new Date(msg.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const last = groupedMessages[groupedMessages.length - 1];
    if (!last || last.date !== key) groupedMessages.push({ date: key, msgs: [msg] });
    else last.msgs.push(msg);
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
      className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-serif text-2xl font-bold text-primary flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-accent" />Messages
          {totalUnread > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="text-sm bg-accent text-accent-foreground rounded-full px-2 py-0.5 font-bold">{totalUnread}
            </motion.span>
          )}
        </h1>
        <p className="text-xs text-muted-foreground">{conversations.length} conversation{conversations.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm" style={{ height: "76vh" }}>
        <div className="flex h-full">

          {/* Sidebar */}
          <div className={`w-full md:w-80 border-r border-border flex flex-col bg-muted/10 ${selectedPartnerId ? "hidden md:flex" : "flex"}`}>
            {/* Search */}
            <div className="p-3 border-b border-border bg-background">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..." className="pl-8 h-9 text-sm border-border bg-muted/30 focus:bg-background transition-all" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-primary transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {filteredConvs.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-14 h-14 bg-muted/40 rounded-full flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">
                    {searchQuery ? "No results found" : "No conversations yet"}
                  </p>
                  {!searchQuery && <p className="text-xs text-muted-foreground">Visit a tutor's profile to start chatting!</p>}
                </div>
              ) : filteredConvs.map(conv => (
                <div key={conv.partnerId}
                  className={`group relative border-b border-border/50 transition-colors ${selectedPartnerId === conv.partnerId ? "bg-accent/10 border-l-[3px] border-l-accent" : "hover:bg-muted/30"}`}>
                  <button onClick={() => setSelectedPartnerId(conv.partnerId)}
                    className="w-full text-left px-4 py-3.5 flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={conv.partnerAvatar ?? ""} className="object-cover" />
                        <AvatarFallback className={`font-bold text-sm ${avatarColor(conv.partnerName)}`}>
                          {conv.partnerName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {conv.unread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-accent-foreground text-[9px] font-black rounded-full flex items-center justify-center border border-background">
                          {conv.unread > 9 ? "9+" : conv.unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-sm truncate ${conv.unread > 0 ? "font-bold text-primary" : "font-semibold text-primary"}`}>
                          {conv.partnerName}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{timeAgo(conv.lastAt)}</span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${conv.unread > 0 ? "text-primary font-medium" : "text-muted-foreground"}`}>
                        {conv.lastMessage || "Start a conversation..."}
                      </p>
                      <span className={`text-[10px] capitalize mt-0.5 block ${selectedPartnerId === conv.partnerId ? "text-accent" : "text-muted-foreground/60"}`}>
                        {conv.partnerRole}
                      </span>
                    </div>
                  </button>

                  {/* Delete button — visible on hover */}
                  <button
                    onClick={e => { e.stopPropagation(); setShowDeleteConfirm(conv.partnerId); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Delete conversation">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div className={`flex-1 flex flex-col min-w-0 ${selectedPartnerId ? "flex" : "hidden md:flex"}`}>
            {selectedPartnerId && selectedConv ? (
              <>
                {/* Chat header */}
                <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-background shadow-sm">
                  <button className="md:hidden text-muted-foreground hover:text-primary transition-colors p-1"
                    onClick={() => setSelectedPartnerId(null)}>
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarImage src={selectedConv.partnerAvatar ?? ""} className="object-cover" />
                    <AvatarFallback className={`font-bold text-sm ${avatarColor(selectedConv.partnerName)}`}>
                      {selectedConv.partnerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-primary text-sm truncate">{selectedConv.partnerName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{selectedConv.partnerRole}</p>
                  </div>
                  {/* Header actions */}
                  <div className="relative flex-shrink-0">
                    <button onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <AnimatePresence>
                      {showHeaderMenu && (
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 min-w-[160px]">
                          <button onClick={() => { setShowDeleteConfirm(selectedPartnerId); setShowHeaderMenu(false); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors">
                            <Trash2 className="w-4 h-4" />Delete Chat
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-muted/5"
                  onClick={() => setShowHeaderMenu(false)}>
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                      <div className="w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm">No messages yet — say hello! 👋</p>
                    </div>
                  )}
                  <AnimatePresence initial={false}>
                    {groupedMessages.map(group => (
                      <div key={group.date}>
                        {/* Date header */}
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-[11px] text-muted-foreground font-medium bg-muted/40 px-3 py-1 rounded-full border border-border/50">
                            {formatDateHeader(group.msgs[0].createdAt)}
                          </span>
                          <div className="flex-1 h-px bg-border" />
                        </div>

                        <div className="space-y-1.5">
                          {group.msgs.map((msg, idx) => {
                            const mine = msg.senderId === userId;
                            const nextMsg = group.msgs[idx + 1];
                            const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
                            const prevMsg = group.msgs[idx - 1];
                            const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;

                            return (
                              <motion.div key={msg.id}
                                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.15 }}
                                className={`flex ${mine ? "justify-end" : "justify-start"} items-end gap-2`}>

                                {/* Avatar for others — only on last in group */}
                                {!mine && (
                                  <div className="w-7 flex-shrink-0 mb-0.5">
                                    {isLastInGroup && (
                                      <Avatar className="w-7 h-7">
                                        <AvatarImage src={selectedConv.partnerAvatar ?? ""} className="object-cover" />
                                        <AvatarFallback className={`text-[10px] font-bold ${avatarColor(selectedConv.partnerName)}`}>
                                          {selectedConv.partnerName.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                  </div>
                                )}

                                <div className={`flex flex-col ${mine ? "items-end" : "items-start"} max-w-[72%]`}>
                                  <div className={`px-3.5 py-2.5 text-sm shadow-sm ${
                                    mine
                                      ? `bg-accent text-accent-foreground ${isFirstInGroup ? "rounded-t-2xl" : "rounded-t-lg"} ${isLastInGroup ? "rounded-bl-2xl rounded-br-sm" : "rounded-l-2xl rounded-r-lg"}`
                                      : `bg-card text-primary border border-border/60 ${isFirstInGroup ? "rounded-t-2xl" : "rounded-t-lg"} ${isLastInGroup ? "rounded-br-2xl rounded-bl-sm" : "rounded-r-2xl rounded-l-lg"}`
                                  }`}>
                                    <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                                  </div>
                                  {isLastInGroup && (
                                    <div className={`flex items-center gap-1 mt-1 ${mine ? "flex-row-reverse" : ""}`}>
                                      <span className="text-[10px] text-muted-foreground/60">{formatTime(msg.createdAt)}</span>
                                      {mine && msg.isRead === 1 && <CheckCheck className="w-3 h-3 text-accent" />}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </AnimatePresence>
                  <div ref={bottomRef} />
                </div>

                {/* Input area */}
                <div className="p-3 border-t border-border bg-background">
                  <div className="flex items-center gap-2">
                    <Input
                      ref={inputRef}
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 rounded-xl border-border bg-muted/30 focus:bg-background transition-all h-10"
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && text.trim()) { e.preventDefault(); handleSend(); } }}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!text.trim() || sendMutation.isPending}
                      className="bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-105 active:scale-95 transition-all rounded-xl w-10 h-10 p-0 shadow-sm flex-shrink-0">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 mt-1.5 px-1">Press Enter to send</p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-5 text-muted-foreground p-6">
                <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center border border-accent/20">
                  <MessageSquare className="w-10 h-10 text-accent/50" />
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-base font-semibold text-primary">Your Messages</p>
                  <p className="text-sm text-muted-foreground">Select a conversation from the sidebar</p>
                  <p className="text-xs text-muted-foreground/60">or visit a tutor's profile to start chatting</p>
                </div>
                {conversations.length === 0 && (
                  <Link href="/tutors">
                    <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                      <Search className="w-4 h-4" />Browse Tutors
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary">Delete Conversation?</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    with {conversations.find(c => c.partnerId === showDeleteConfirm)?.partnerName ?? "this person"}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All messages in this conversation will be permanently deleted for you. This cannot be undone.
              </p>
              <div className="flex gap-2.5">
                <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
                  onClick={() => deleteConvMutation.mutate(showDeleteConfirm!)}
                  disabled={deleteConvMutation.isPending}>
                  <Trash2 className="w-4 h-4" />
                  {deleteConvMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
