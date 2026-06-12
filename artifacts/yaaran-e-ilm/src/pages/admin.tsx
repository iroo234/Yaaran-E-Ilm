import { useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, GraduationCap, CheckCircle, XCircle, Clock, BookOpen, Trash2, ShieldCheck, ToggleLeft, ToggleRight, Star, CalendarCheck } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: "Error" })); throw new Error(err.error ?? "Request failed"); }
  return res.json();
}

type AdminStats = { totalUsers: number; totalTutors: number; pendingTutors: number; approvedTutors: number; totalClasses: number; totalEnrollments: number; totalBookings: number; completedSessions: number; totalReviews: number; adminCount: number; };
type AdminUser = { id: number; name: string; email: string; role: string; isAdmin: boolean; createdAt: string; };
type AdminTutor = { id: number; userId: number; name: string; email: string; bio?: string; subject?: string; level?: string; isApproved: boolean; hourlyRate?: string; createdAt: string; };
type AdminBooking = { id: number; studentName: string; tutorName: string; subject: string; date: string; timeSlot: string; status: string; hourlyRate: string; createdAt: string; };
type AdminReview = { id: number; studentName: string; tutorName: string; rating: number; comment?: string; createdAt: string; };
type Admin = { id: number; name: string; email: string; createdAt: string; };

export function Admin() {
  const { data: user, isLoading } = useGetMe();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "tutors" | "users" | "bookings" | "reviews" | "admins">("pending");

  const { data: stats } = useQuery<AdminStats>({ queryKey: ["admin-stats"], queryFn: () => apiFetch("/api/admin/stats"), enabled: !!user });
  const { data: pending = [] } = useQuery<AdminTutor[]>({ queryKey: ["admin-pending"], queryFn: () => apiFetch("/api/admin/tutors/pending"), enabled: !!user && tab === "pending" });
  const { data: allTutors = [] } = useQuery<AdminTutor[]>({ queryKey: ["admin-tutors"], queryFn: () => apiFetch("/api/admin/tutors"), enabled: !!user && tab === "tutors" });
  const { data: allUsers = [] } = useQuery<AdminUser[]>({ queryKey: ["admin-users"], queryFn: () => apiFetch("/api/admin/users"), enabled: !!user && tab === "users" });
  const { data: bookings = [] } = useQuery<AdminBooking[]>({ queryKey: ["admin-bookings"], queryFn: () => apiFetch("/api/admin/bookings"), enabled: !!user && tab === "bookings" });
  const { data: reviews = [] } = useQuery<AdminReview[]>({ queryKey: ["admin-reviews"], queryFn: () => apiFetch("/api/admin/reviews"), enabled: !!user && tab === "reviews" });
  const { data: admins = [] } = useQuery<Admin[]>({ queryKey: ["admin-admins"], queryFn: () => apiFetch("/api/admin/admins"), enabled: !!user && tab === "admins" });
  const { data: setupToggle } = useQuery<{ enabled: boolean }>({ queryKey: ["admin-setup-toggle"], queryFn: () => apiFetch("/api/admin/setup-toggle"), enabled: !!user && tab === "admins" });

  const approve = useMutation({ mutationFn: (id: number) => apiFetch(`/api/admin/tutors/${id}/approve`, { method: "POST" }), onSuccess: () => { toast({ title: "Approved!" }); qc.invalidateQueries({ queryKey: ["admin-pending"] }); qc.invalidateQueries({ queryKey: ["admin-tutors"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); }, onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }) });
  const reject = useMutation({ mutationFn: (id: number) => apiFetch(`/api/admin/tutors/${id}/reject`, { method: "POST" }), onSuccess: () => { toast({ title: "Rejected" }); qc.invalidateQueries({ queryKey: ["admin-pending"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); }, onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }) });
  const deleteUser = useMutation({ mutationFn: (id: number) => apiFetch(`/api/admin/users/${id}`, { method: "DELETE" }), onSuccess: () => { toast({ title: "User removed" }); qc.invalidateQueries({ queryKey: ["admin-users"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); }, onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }) });
  const deleteReview = useMutation({ mutationFn: (id: number) => apiFetch(`/api/admin/reviews/${id}`, { method: "DELETE" }), onSuccess: () => { toast({ title: "Review removed" }); qc.invalidateQueries({ queryKey: ["admin-reviews"] }); }, onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }) });
  const removeAdmin = useMutation({ mutationFn: (id: number) => apiFetch(`/api/admin/admins/${id}`, { method: "DELETE" }), onSuccess: () => { toast({ title: "Admin removed" }); qc.invalidateQueries({ queryKey: ["admin-admins"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); }, onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }) });
  const toggleSetup = useMutation({ mutationFn: (enabled: boolean) => apiFetch("/api/admin/setup-toggle", { method: "POST", body: JSON.stringify({ enabled }) }), onSuccess: () => { toast({ title: "Setup toggle updated" }); qc.invalidateQueries({ queryKey: ["admin-setup-toggle"] }); }, onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }) });

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">Loading...</div>;
  if (!user) return <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4"><ShieldCheck className="w-12 h-12 text-muted-foreground" /><h2 className="font-serif text-2xl font-bold text-primary">Admin Access Required</h2><Link href="/login"><Button className="bg-accent text-accent-foreground">Log in</Button></Link></div>;
  if (!(user as any).isAdmin) return <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4"><ShieldCheck className="w-12 h-12 text-destructive" /><h2 className="font-serif text-2xl font-bold text-primary">Access Denied</h2><Link href="/"><Button variant="outline">Go Home</Button></Link></div>;

  const TABS = [
    { id: "pending" as const, label: "Pending", icon: <Clock className="w-4 h-4" />, count: stats?.pendingTutors },
    { id: "tutors" as const, label: "Tutors", icon: <GraduationCap className="w-4 h-4" />, count: stats?.totalTutors },
    { id: "users" as const, label: "Users", icon: <Users className="w-4 h-4" />, count: stats?.totalUsers },
    { id: "bookings" as const, label: "Bookings", icon: <CalendarCheck className="w-4 h-4" />, count: stats?.totalBookings },
    { id: "reviews" as const, label: "Reviews", icon: <Star className="w-4 h-4" />, count: stats?.totalReviews },
    { id: "admins" as const, label: "Admins", icon: <ShieldCheck className="w-4 h-4" />, count: stats?.adminCount },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6"><ShieldCheck className="w-7 h-7 text-accent" /><div><h1 className="font-serif text-2xl md:text-3xl font-bold">Admin Dashboard</h1><p className="text-primary-foreground/60 text-sm">Yaaran E Ilm</p></div></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Users", value: stats?.totalUsers ?? "-", icon: <Users className="w-4 h-4 text-accent" /> },
              { label: "Active Tutors", value: stats?.approvedTutors ?? "-", icon: <CheckCircle className="w-4 h-4 text-green-400" /> },
              { label: "Sessions Done", value: stats?.completedSessions ?? "-", icon: <CalendarCheck className="w-4 h-4 text-blue-400" /> },
              { label: "Pending Review", value: stats?.pendingTutors ?? "-", icon: <Clock className="w-4 h-4 text-yellow-400" /> },
            ].map(s => (
              <div key={s.label} className="bg-primary-foreground/10 rounded-xl p-3 flex items-center gap-2">
                {s.icon}<div><p className="text-xl font-bold font-serif text-primary-foreground">{s.value}</p><p className="text-xs text-primary-foreground/60">{s.label}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all border ${tab === t.id ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-primary"}`}>
              {t.icon}{t.label}
              {t.count !== undefined && <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === t.id ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>{t.count}</span>}
            </button>
          ))}
        </div>

        {/* Pending */}
        {tab === "pending" && (
          <div className="space-y-4">
            {pending.length === 0 ? <div className="bg-card border border-border rounded-2xl p-12 text-center"><CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" /><p className="font-serif text-xl font-bold text-primary">All caught up!</p></div>
            : pending.map(t => (
              <div key={t.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap"><h3 className="font-serif text-lg font-bold text-primary">{t.name}</h3><span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-semibold">Pending</span></div>
                    <p className="text-sm text-muted-foreground">{t.email}</p>
                    <div className="flex gap-2 flex-wrap">{t.subject && <span className="text-xs bg-accent/15 text-primary px-2 py-0.5 rounded-full">{t.subject}</span>}{t.level && <span className="text-xs bg-secondary text-primary px-2 py-0.5 rounded-full border border-border">{t.level}</span>}</div>
                    {t.bio && <p className="text-sm text-muted-foreground border-l-2 border-accent/30 pl-3">{t.bio}</p>}
                    <p className="text-xs text-muted-foreground">Applied {new Date(t.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1" onClick={() => approve.mutate(t.id)} disabled={approve.isPending}><CheckCircle className="w-4 h-4" />Approve</Button>
                    <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/5 gap-1" onClick={() => reject.mutate(t.id)} disabled={reject.isPending}><XCircle className="w-4 h-4" />Reject</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All Tutors */}
        {tab === "tutors" && (
          <div className="space-y-3">
            {allTutors.map(t => (
              <div key={t.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3"><div className="w-9 h-9 bg-accent/20 rounded-full flex items-center justify-center"><GraduationCap className="w-4 h-4 text-accent" /></div>
                  <div><p className="font-semibold text-sm text-primary">{t.name}</p><p className="text-xs text-muted-foreground">{t.email}</p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">{t.subject && <span className="text-xs bg-accent/15 text-primary px-1.5 py-0.5 rounded">{t.subject}</span>}{t.level && <span className="text-xs bg-secondary text-primary px-1.5 py-0.5 rounded border border-border">{t.level}</span>}<span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${t.isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{t.isApproved ? "Approved" : "Pending"}</span></div>
                  </div>
                </div>
                <div className="flex gap-2">{!t.isApproved && <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1 text-xs" onClick={() => approve.mutate(t.id)}><CheckCircle className="w-3.5 h-3.5" />Approve</Button>}{t.isApproved && <Button size="sm" variant="outline" className="border-destructive text-destructive gap-1 text-xs" onClick={() => reject.mutate(t.id)}><XCircle className="w-3.5 h-3.5" />Revoke</Button>}</div>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {tab === "users" && (
          <div className="space-y-2">
            {allUsers.map(u => (
              <div key={u.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3"><div className={`w-9 h-9 rounded-full flex items-center justify-center ${u.isAdmin ? "bg-primary" : "bg-muted"}`}>{u.isAdmin ? <ShieldCheck className="w-4 h-4 text-primary-foreground" /> : <Users className="w-4 h-4 text-muted-foreground" />}</div>
                  <div><div className="flex items-center gap-2 flex-wrap"><p className="font-semibold text-sm text-primary">{u.name}</p>{u.isAdmin && <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold">Admin</span>}<span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded capitalize">{u.role}</span></div><p className="text-xs text-muted-foreground">{u.email}</p></div>
                </div>
                {!u.isAdmin && <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/5 h-8 w-8 p-0" onClick={() => { if (confirm(`Remove ${u.name}?`)) deleteUser.mutate(u.id); }}><Trash2 className="w-4 h-4" /></Button>}
              </div>
            ))}
          </div>
        )}

        {/* Bookings */}
        {tab === "bookings" && (
          <div className="space-y-3">
            {bookings.length === 0 ? <div className="text-center py-8 text-muted-foreground">No bookings yet.</div>
            : bookings.map(b => (
              <div key={b.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="font-medium text-primary text-sm">{b.studentName} → {b.tutorName}</p><p className="text-xs text-muted-foreground">{b.subject} · {b.date} at {b.timeSlot}</p><p className="text-xs text-muted-foreground">Rate: {b.hourlyRate === "free" ? "Free" : `PKR ${b.hourlyRate}/hr`}</p></div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold capitalize flex-shrink-0 ${b.status === "confirmed" ? "bg-blue-100 text-blue-700 border-blue-200" : b.status === "completed" || b.status === "reviewed" ? "bg-green-100 text-green-700 border-green-200" : b.status === "declined" ? "bg-red-100 text-red-700 border-red-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"}`}>{b.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reviews */}
        {tab === "reviews" && (
          <div className="space-y-3">
            {reviews.length === 0 ? <div className="text-center py-8 text-muted-foreground">No reviews yet.</div>
            : reviews.map(r => (
              <div key={r.id} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-3">
                <div><div className="flex items-center gap-2"><p className="font-medium text-sm text-primary">{r.studentName} → {r.tutorName}</p><span className="text-yellow-400 text-sm">{"★".repeat(Math.round(r.rating))}</span></div>{r.comment && <p className="text-xs text-muted-foreground mt-1">"{r.comment}"</p>}<p className="text-xs text-primary/40 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p></div>
                <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/5 h-8 w-8 p-0 flex-shrink-0" onClick={() => deleteReview.mutate(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            ))}
          </div>
        )}

        {/* Admins */}
        {tab === "admins" && (
          <div className="space-y-6">
            {/* Setup toggle */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="font-serif text-lg font-bold text-primary flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-accent" />Setup Page Control</h2>
              <p className="text-sm text-muted-foreground">The /setup page allows creating admin accounts. It automatically locks after 2 admins. You can manually re-enable it to add a 3rd admin.</p>
              <div className="flex items-center gap-4 p-4 bg-muted/30 border border-border rounded-xl">
                <div className="flex-1"><p className="font-medium text-primary text-sm">/setup page</p><p className="text-xs text-muted-foreground">{setupToggle?.enabled ? "Currently open — new admins can register" : "Locked — only existing admins can access"}</p></div>
                <button onClick={() => toggleSetup.mutate(!setupToggle?.enabled)} disabled={toggleSetup.isPending} className="flex items-center gap-2 text-sm font-semibold text-primary">
                  {setupToggle?.enabled ? <ToggleRight className="w-8 h-8 text-green-500" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                  {setupToggle?.enabled ? "Enabled" : "Disabled"}
                </button>
              </div>
            </div>

            {/* Admin list */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="font-serif text-lg font-bold text-primary">Admin Accounts ({admins.length})</h2>
              <div className="space-y-2">
                {admins.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 border border-border rounded-xl bg-muted/20">
                    <div className="flex items-center gap-3"><div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-primary-foreground" /></div><div><p className="font-semibold text-sm text-primary">{a.name}</p><p className="text-xs text-muted-foreground">{a.email}</p></div></div>
                    {a.id !== (user as any).id && <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/5 h-8 w-8 p-0" onClick={() => { if (confirm(`Remove ${a.name} as admin?`)) removeAdmin.mutate(a.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">To add another admin, enable the setup page above, then have them register at <strong>/setup</strong>.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
