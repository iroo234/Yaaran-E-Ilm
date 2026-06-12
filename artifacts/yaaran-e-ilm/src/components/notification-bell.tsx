import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

type Notification = { id: number; type: string; title: string; body: string; isRead: number; createdAt: string; };

export function NotificationBell() {
  const { data: user } = useGetMe();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => apiFetch("/api/notifications"),
    enabled: !!user,
    refetchInterval: 15000,
  });

  const readAllMutation = useMutation({
    mutationFn: () => apiFetch("/api/notifications/read-all", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (!user) return null;

  const unread = notifications.filter(n => n.isRead === 0).length;

  return (
    <div className="relative">
      <button onClick={() => { setOpen(!open); }} className="relative p-2 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-primary text-sm">Notifications</h3>
              {unread > 0 && (
                <button onClick={() => readAllMutation.mutate()} className="text-xs text-accent hover:text-accent/80 flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">No notifications yet</div>
              ) : notifications.slice(0, 20).map(n => (
                <div key={n.id} className={`p-4 border-b border-border/50 last:border-0 transition-colors ${n.isRead === 0 ? "bg-accent/5" : ""}`}>
                  <div className="flex items-start gap-2">
                    {n.isRead === 0 && <div className="w-1.5 h-1.5 bg-accent rounded-full mt-1.5 flex-shrink-0" />}
                    <div className={n.isRead === 0 ? "" : "ml-3.5"}>
                      <p className="text-sm font-semibold text-primary">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                      <p className="text-xs text-primary/30 mt-1">{new Date(n.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
