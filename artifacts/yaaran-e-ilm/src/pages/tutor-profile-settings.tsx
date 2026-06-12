import { useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Clock, Plus, Trash2, DollarSign } from "lucide-react";
import { Link } from "wouter";

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
  const [rate, setRate] = useState("");
  const [newSlot, setNewSlot] = useState({ dayOfWeek: "Monday", startTime: "09:00", endTime: "11:00" });

  const { data: slots = [] } = useQuery<Slot[]>({
    queryKey: ["my-availability"],
    queryFn: () => apiFetch(`/api/availability/${(user as any)?.id}`),
    enabled: !!user,
  });

  const rateMutation = useMutation({
    mutationFn: () => apiFetch("/api/tutors/my/rate", { method: "PATCH", body: JSON.stringify({ hourlyRate: rate || "free" }) }),
    onSuccess: () => toast({ title: "Rate updated!" }),
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
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

  if (!user || user.role !== "tutor") return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <p className="text-muted-foreground">Tutor accounts only.</p>
      <Link href="/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <h1 className="font-serif text-2xl font-bold text-primary flex items-center gap-2"><Settings className="w-6 h-6 text-accent" />Tutor Settings</h1>

      {/* Rate */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-serif text-lg font-bold text-primary flex items-center gap-2"><DollarSign className="w-5 h-5 text-accent" />Hourly Rate</h2>
        <p className="text-sm text-muted-foreground">Set your hourly rate in PKR, or keep it free. Students will see this on your profile.</p>
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-1.5">
            <Label>Rate (PKR/hr)</Label>
            <Input value={rate} onChange={e => setRate(e.target.value)} placeholder="Leave blank for free" type="number" min="0" />
          </div>
          <Button onClick={() => rateMutation.mutate()} disabled={rateMutation.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">{rateMutation.isPending ? "Saving..." : "Save Rate"}</Button>
        </div>
        <p className="text-xs text-muted-foreground">Note: Platform takes 20% commission on paid sessions. Students pay you directly after session confirmation.</p>
      </div>

      {/* Availability */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-serif text-lg font-bold text-primary flex items-center gap-2"><Clock className="w-5 h-5 text-accent" />Availability</h2>
        <p className="text-sm text-muted-foreground">Add the days and times you are available for sessions.</p>

        {slots.length > 0 ? (
          <div className="space-y-2">
            {slots.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-muted/30 border border-border rounded-xl px-4 py-2.5">
                <span className="text-sm font-medium text-primary">{s.dayOfWeek}</span>
                <span className="text-sm text-muted-foreground">{s.startTime} — {s.endTime}</span>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive h-7 w-7 p-0" onClick={() => deleteSlotMutation.mutate(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No availability slots added yet.</p>
        )}

        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-sm font-medium text-primary">Add Slot</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Day</Label>
              <select value={newSlot.dayOfWeek} onChange={e => setNewSlot(s => ({...s, dayOfWeek: e.target.value}))} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-primary focus:outline-none focus:ring-2 focus:ring-accent/40">
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start</Label>
              <Input type="time" value={newSlot.startTime} onChange={e => setNewSlot(s => ({...s, startTime: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End</Label>
              <Input type="time" value={newSlot.endTime} onChange={e => setNewSlot(s => ({...s, endTime: e.target.value}))} />
            </div>
          </div>
          <Button onClick={() => addSlotMutation.mutate()} disabled={addSlotMutation.isPending} className="gap-1 bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="w-4 h-4" />{addSlotMutation.isPending ? "Adding..." : "Add Slot"}</Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>
        <Link href="/resources"><Button variant="outline">Manage Resources</Button></Link>
      </div>
    </div>
  );
}
