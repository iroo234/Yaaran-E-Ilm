import { useState, useEffect, useRef } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageSquare, ArrowLeft, Search } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Error" })); throw new Error(e.error ?? "Request failed"); }
  return res.json();
}

type Conversation = { partnerId: number; partnerName: string; partnerRole: string; lastMessage: string; lastAt: string; unread: number; };
type Message = { id: number; senderId: number; receiverId: number; content: string; isRead: number; createdAt: string; };

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString("en-PK", { month: "short", day: "numeric" });
}

export function Messages() {
  const { data: user } = useGetMe();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialWith = params.get("with") ? parseInt(params.get("with")!) : null;

  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(initialWith);
  const [text, setText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (selectedPartnerId) inputRef.current?.focus(); }, [selectedPartnerId]);

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <p className="text-muted-foreground">Please log in to view messages.</p>
      <Link href="/login"><Button className="bg-accent text-accent-foreground">Log in</Button></Link>
    </div>
  );

  const userId = (user as any).id;
  const selectedConv = conversations.find(c => c.partnerId === selectedPartnerId);
  const filteredConvs = conversations.filter(c => c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  const handleSend = () => { if (text.trim()) sendMutation.mutate(text.trim()); };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-primary flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-accent" />Messages
          {totalUnread > 0 && <span className="text-sm bg-accent text-accent-foreground rounded-full px-2 py-0.5 font-bold">{totalUnread}</span>}
        </h1>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm" style={{ height: "72vh" }}>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className={`w-full md:w-80 border-r border-border flex flex-col ${selectedPartnerId ? "hidden md:flex" : "flex"}`}>
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search conversations..." className="pl-8 h-9 text-sm border-border" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConvs.length === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-muted-foreground text-sm">No conversations yet.</p>
                  <p className="text-xs text-muted-foreground">Visit a tutor's profile to start chatting!</p>
                </div>
              ) : filteredConvs.map(conv => (
                <button key={conv.partnerId} onClick={() => setSelectedPartnerId(conv.partnerId)}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors flex items-center gap-3 ${selectedPartnerId === conv.partnerId ? "bg-accent/10 border-l-2 border-l-accent" : ""}`}>
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarFallback className="bg-accent/20 text-primary font-semibold text-sm">{conv.partnerName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-primary truncate">{conv.partnerName}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-1">{conv.lastAt ? timeAgo(conv.lastAt) : ""}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-muted-foreground truncate flex-1">{conv.lastMessage || "Say hello!"}</p>
                      {conv.unread > 0 && <span className="text-[10px] bg-accent text-accent-foreground rounded-full w-4 h-4 flex items-center justify-center font-bold flex-shrink-0 ml-1">{conv.unread}</span>}
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 capitalize">{conv.partnerRole}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className={`flex-1 flex flex-col ${selectedPartnerId ? "flex" : "hidden md:flex"}`}>
            {selectedPartnerId && selectedConv ? (
              <>
                <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-muted/20">
                  <button className="md:hidden text-muted-foreground hover:text-primary transition-colors" onClick={() => setSelectedPartnerId(null)}>
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-accent/20 text-primary font-bold text-sm">{selectedConv.partnerName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-primary text-sm">{selectedConv.partnerName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{selectedConv.partnerRole}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                  <AnimatePresence initial={false}>
                    {messages.map(msg => {
                      const mine = msg.senderId === userId;
                      return (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.18 }}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${mine ? "bg-accent text-accent-foreground rounded-br-sm" : "bg-muted text-primary rounded-bl-sm"}`}>
                            <p className="leading-relaxed">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${mine ? "text-accent-foreground/60 text-right" : "text-muted-foreground"}`}>
                              {new Date(msg.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={bottomRef} />
                </div>

                <div className="p-3 border-t border-border flex gap-2 bg-background">
                  <Input ref={inputRef} value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-xl border-border focus:border-accent transition-all"
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && text.trim()) { e.preventDefault(); handleSend(); } }} />
                  <Button onClick={handleSend} disabled={!text.trim() || sendMutation.isPending}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-105 transition-all rounded-xl px-3 shadow-sm">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-primary">Select a conversation</p>
                  <p className="text-xs text-muted-foreground mt-1">Or visit a tutor's profile to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
