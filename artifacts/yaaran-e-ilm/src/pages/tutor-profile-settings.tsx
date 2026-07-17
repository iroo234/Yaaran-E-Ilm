import { useState, useRef } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Settings, Clock, Plus, Trash2, Camera, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Error" })); throw new Error(e.error ?? "Request failed"); }
  return res.json();
}

type Slot = { id: number; tutorId: number; dayOfWeek: string; startTime: string; endTime: string; };
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function TutorProfileSettings() {
  const { data: user } = useGetMe();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newSlot, setNewSlot] = useState({ dayOfWeek: "Monday", startTime: "09:00", endTime: "11:00" });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: slots = [] } = useQuery<Slot[]>({
    queryKey: ["my-availability"],
    queryFn: () => apiFetch(`/api/availability/${(user as any)?.id}`),
    enabled: !!user,
  });

  const addSlotMutation = useMutation({
    mutationFn: () => apiFetch("/api/availability", { method: "POST", body: JSON.stringify(newSlot) }),
    onSuccess: () => { toast({ title: "Slot added!" }); qc.invalidateQueries({ queryKey: ["my-availability"] }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const deleteSlotMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/availability/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast({ title: "Slot removed" }); qc.invalidateQueries({ queryKey: ["my-availability"] }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast({ variant: "destructive", title: "Invalid file", description: "Please use JPG, PNG, or WebP." }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ variant: "destructive", title: "File too large", description: "Max 5MB." }); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        await apiFetch("/api/profile/avatar", { method: "PATCH", body: JSON.stringify({ avatarUrl: dataUrl }) });
        qc.invalidateQueries({ queryKey: ["me"] });
        toast({ title: "Profile picture updated! 🎉" });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast({ variant: "destructive", title: "Upload failed" });
      setUploading(false);
    }
  };

  const initials = user?.name?.split(" ").map((w: string) => w[0]).join("").toUpperCase() ?? "?";

  if (!user) return <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <h1 className="font-serif text-2xl font-bold text-primary flex items-center gap-2"><Settings className="w-6 h-6 text-accent" />Profile Settings</h1>

      {/* Avatar */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-serif text-lg font-bold text-primary flex items-center gap-2"><Camera className="w-5 h-5 text-accent" />Profile Picture</h2>
        <div className="flex items-center gap-5">
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <Avatar className="w-20 h-20 border-4 border-accent/20">
              {uploading ? <div className="w-full h-full flex items-center justify-center bg-muted"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
               : <><AvatarImage src={(user as any).avatarUrl ?? ""} className="object-cover" /><AvatarFallback className="text-xl font-serif bg-accent/20 text-primary font-bold">{initials}</AvatarFallback></>}
            </Avatar>
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-primary text-sm">Click your photo to change it</p>
            <p className="text-xs text-muted-foreground">JPG, PNG or WebP · Max 5MB</p>
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1.5">
              <Camera className="w-3.5 h-3.5" />{uploading ? "Uploading..." : "Upload Photo"}
            </Button>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
      </div>

      {user.role === "tutor" && (
        /* Availability */
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold text-primary flex items-center gap-2"><Clock className="w-5 h-5 text-accent" />Availability</h2>
          <p className="text-sm text-muted-foreground">Set the days and times when you're available to teach.</p>
          {slots.length > 0 ? (
            <div className="space-y-2">
              {slots.map(s => (
                <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between bg-muted/30 border border-border rounded-xl px-4 py-2.5">
                  <span className="text-sm font-medium text-primary">{s.dayOfWeek}</span>
                  <span className="text-sm text-muted-foreground">{s.startTime} — {s.endTime}</span>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive h-7 w-7 p-0" onClick={() => deleteSlotMutation.mutate(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </motion.div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground italic">No slots added yet.</p>}
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-sm font-medium text-primary">Add Slot</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label className="text-xs">Day</Label>
                <select value={newSlot.dayOfWeek} onChange={e => setNewSlot(s => ({...s, dayOfWeek: e.target.value}))} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-primary focus:outline-none focus:ring-2 focus:ring-accent/40">
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Start</Label><Input type="time" value={newSlot.startTime} onChange={e => setNewSlot(s => ({...s, startTime: e.target.value}))} /></div>
              <div className="space-y-1"><Label className="text-xs">End</Label><Input type="time" value={newSlot.endTime} onChange={e => setNewSlot(s => ({...s, endTime: e.target.value}))} /></div>
            </div>
            <Button onClick={() => addSlotMutation.mutate()} disabled={addSlotMutation.isPending} className="gap-1 bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="w-4 h-4" />{addSlotMutation.isPending ? "Adding..." : "Add Slot"}</Button>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>
      </div>
    </motion.div>
  );
}
