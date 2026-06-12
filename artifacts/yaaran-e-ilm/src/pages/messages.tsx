import { useState, useEffect, useRef } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageSquare, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Error" })); throw new Error(e.error ?? "Request failed"); }
  return res.json();
}

type Conversation = { partnerId: number; partnerName: string; partnerRole: string; lastMessage: string; lastAt: string; unread: number; };
type Message = { id: number; senderId: number; receiverId: number; content: string; isRead: number; createdAt: string; };

export function Messages() {
  const { data: user } = useGetMe();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialWith = params.get("with") ? parseInt(params.get("with")!) : null;

  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(initialWith);
  const [text, setText] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: () => apiFetch("/api/messages/conversations"),
    enabled: !!user,
    refetchInterval: 5000,
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["messages", selectedPartnerId],
    queryFn: () => apiFetch(`/api/messages/${selectedPartnerId}`),
    enabled: !!selectedPartnerId && !!user,
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => apiFetch("/api/messages", { method: "POST", body: JSON.stringify({ receiverId: selectedPartnerId, content }) }),
    onSuccess: () => { setText(""); qc.invalidateQueries({ queryKey: ["messages", selectedPartnerId] }); qc.invalidateQueries({ queryKey: ["conversations"] }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <p className="text-muted-foreground">Please log in to view messages.</p>
      <Link href="/login"><Button className="bg-accent text-accent-foreground">Log in</Button></Link>
    </div>
  );

  const selectedConv = conversations.find(c => c.partnerId === selectedPartnerId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="font-serif text-2xl font-bold text-primary mb-6 flex items-center gap-2"><MessageSquare className="w-6 h-6 text-accent" />Messages</h1>
      <div className="bg-card border border-border rounded-2xl overflow-hidden" style={{ height: "70vh" }}>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className={`w-full md:w-80 border-r border-border flex flex-col ${selectedPartnerId ? "hidden md:flex" : "flex"}`}>
            <div className="p-4 border-b border-border">
              <p className="font-semibold text-primary text-sm">Conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">No conversations yet. Start one from a tutor's profile!</div>
              ) : conversations.map(conv => (
                <button key={conv.partnerId} onClick={() => setSelectedPartnerId(conv.partnerId)}
                  className={`w-full text-left p-4 border-b border-border/50 hover:bg-muted/30 transition-colors ${selectedPartnerId === conv.partnerId ? "bg-accent/10 border-l-2 border-l-accent" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-primary truncate">{conv.partnerName}</span>
                    {conv.unread > 0 && <span className="text-xs bg-accent text-accent-foreground rounded-full px-1.5 py-0.5 font-bold">{conv.unread}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.lastMessage || "No messages yet"}</p>
                  <span className="text-xs text-primary/40 capitalize">{conv.partnerRole}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className={`flex-1 flex flex-col ${selectedPartnerId ? "flex" : "hidden md:flex"}`}>
            {selectedPartnerId && selectedConv ? (
              <>
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <button className="md:hidden text-muted-foreground" onClick={() => setSelectedPartnerId(null)}><ArrowLeft className="w-5 h-5" /></button>
                  <div>
                    <p className="font-semibold text-primary">{selectedConv.partnerName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{selectedConv.partnerRole}</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(msg => {
                    const mine = msg.senderId === (user as any).id;
                    return (
                      <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-accent text-accent-foreground rounded-br-sm" : "bg-muted text-primary rounded-bl-sm"}`}>
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${mine ? "text-accent-foreground/60" : "text-muted-foreground"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                <div className="p-4 border-t border-border flex gap-2">
                  <Input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-xl"
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && text.trim()) { e.preventDefault(); sendMutation.mutate(text.trim()); } }} />
                  <Button onClick={() => text.trim() && sendMutation.mutate(text.trim())} disabled={!text.trim() || sendMutation.isPending}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl px-3"><Send className="w-4 h-4" /></Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <MessageSquare className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-sm">Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
