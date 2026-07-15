import { useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, GraduationCap, CheckCircle, XCircle, Clock, Trash2,
  ShieldCheck, ToggleLeft, ToggleRight, Star, CalendarCheck, Edit3,
  Save, Phone, ChevronDown, ChevronRight, Globe, Heart, BookOpen,
  MessageSquare, LayoutDashboard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: "Error" })); throw new Error(err.error ?? "Request failed"); }
  return res.json();
}

type AdminStats = { totalUsers: number; totalTutors: number; pendingTutors: number; approvedTutors: number; totalClasses: number; totalEnrollments: number; totalBookings: number; completedSessions: number; totalReviews: number; adminCount: number; };
type AdminUser = { id: number; name: string; email: string; role: string; isAdmin: boolean; phone?: string; grade?: string; age?: number; createdAt: string; };
type AdminTutor = { id: number; userId: number; name: string; email: string; bio?: string; subject?: string; level?: string; isApproved: boolean; hourlyRate?: string; phone?: string; hasPhone: boolean; createdAt: string; };
type AdminBooking = { id: number; studentName: string; tutorName: string; subject: string; date: string; timeSlot: string; status: string; };
type AdminReview = { id: number; studentName: string; tutorName: string; rating: number; comment?: string; createdAt: string; };
type Admin = { id: number; name: string; email: string; createdAt: string; };

// Content sections for the editor — organized by page/section
const CONTENT_SECTIONS = [
  {
    id: "hero", label: "Hero Section", icon: <Globe className="w-4 h-4" />, color: "bg-pink-50 border-pink-200",
    fields: [
      { key: "hero_badge", label: "Badge Text", hint: "Small pill at the top of the hero" },
      { key: "hero_title", label: "Main Title", hint: "The big platform name" },
      { key: "hero_subtitle", label: "Subtitle / Tagline", hint: "Description below the title" },
      { key: "hero_cta_student", label: "Student CTA Button", hint: "Button for students" },
      { key: "hero_cta_tutor", label: "Tutor CTA Button", hint: "Button for tutors" },
    ],
  },
  {
    id: "stats", label: "Stats / Numbers", icon: <Users className="w-4 h-4" />, color: "bg-amber-50 border-amber-200",
    fields: [
      { key: "stats_students_boost", label: "Students Count Boost", hint: "Number added to real DB count (e.g. 200)" },
      { key: "stats_tutors_boost", label: "Tutors Count Boost", hint: "Number added to real DB count (e.g. 15)" },
      { key: "stats_classes_boost", label: "Classes Count Boost", hint: "Number added to real DB count (e.g. 40)" },
      { key: "stats_students_label", label: "Students Label", hint: "Label shown below students count" },
      { key: "stats_tutors_label", label: "Tutors Label", hint: "" },
      { key: "stats_classes_label", label: "Classes Label", hint: "" },
    ],
  },
  {
    id: "hiw", label: "How It Works (4 Steps)", icon: <BookOpen className="w-4 h-4" />, color: "bg-blue-50 border-blue-200",
    fields: [
      { key: "hiw_heading", label: "Section Heading", hint: "" },
      { key: "hiw_desc", label: "Section Subtitle", hint: "" },
      { key: "hiw_1_title", label: "Step 1 Title", hint: "" },
      { key: "hiw_1_desc", label: "Step 1 Description", hint: "" },
      { key: "hiw_2_title", label: "Step 2 Title", hint: "" },
      { key: "hiw_2_desc", label: "Step 2 Description", hint: "" },
      { key: "hiw_3_title", label: "Step 3 Title", hint: "" },
      { key: "hiw_3_desc", label: "Step 3 Description", hint: "" },
      { key: "hiw_4_title", label: "Step 4 Title", hint: "" },
      { key: "hiw_4_desc", label: "Step 4 Description", hint: "" },
    ],
  },
  {
    id: "mission", label: "Mission / About Section", icon: <Heart className="w-4 h-4" />, color: "bg-rose-50 border-rose-200",
    fields: [
      { key: "mission_badge", label: "Badge Text", hint: "" },
      { key: "mission_heading", label: "Main Heading", hint: "" },
      { key: "mission_p1", label: "Paragraph 1", hint: "" },
      { key: "mission_p2", label: "Paragraph 2", hint: "" },
      { key: "mission_cta", label: "CTA Button Text", hint: "" },
      { key: "values_heading", label: "Values Card Title", hint: "Title of the card on the right" },
      { key: "values_1_label", label: "Value 1 Label", hint: "" },
      { key: "values_1_desc", label: "Value 1 Description", hint: "" },
      { key: "values_2_label", label: "Value 2 Label", hint: "" },
      { key: "values_2_desc", label: "Value 2 Description", hint: "" },
      { key: "values_3_label", label: "Value 3 Label", hint: "" },
      { key: "values_3_desc", label: "Value 3 Description", hint: "" },
      { key: "values_4_label", label: "Value 4 Label", hint: "" },
      { key: "values_4_desc", label: "Value 4 Description", hint: "" },
    ],
  },
  {
    id: "join", label: "Join Section (Student & Tutor Cards)", icon: <GraduationCap className="w-4 h-4" />, color: "bg-green-50 border-green-200",
    fields: [
      { key: "join_heading", label: "Section Heading", hint: "" },
      { key: "join_subtitle", label: "Section Subtitle", hint: "" },
      { key: "student_card_heading", label: "Student Card Title", hint: "" },
      { key: "student_card_desc", label: "Student Card Description", hint: "" },
      { key: "student_bullet_1", label: "Student Bullet 1", hint: "" },
      { key: "student_bullet_2", label: "Student Bullet 2", hint: "" },
      { key: "student_bullet_3", label: "Student Bullet 3", hint: "" },
      { key: "tutor_card_heading", label: "Tutor Card Title", hint: "" },
      { key: "tutor_card_desc", label: "Tutor Card Description", hint: "" },
      { key: "tutor_bullet_1", label: "Tutor Bullet 1", hint: "" },
      { key: "tutor_bullet_2", label: "Tutor Bullet 2", hint: "" },
      { key: "tutor_bullet_3", label: "Tutor Bullet 3", hint: "" },
    ],
  },
  {
    id: "reviews", label: "Reviews Section", icon: <Star className="w-4 h-4" />, color: "bg-yellow-50 border-yellow-200",
    fields: [
      { key: "reviews_heading", label: "Section Heading", hint: "" },
      { key: "reviews_subtitle", label: "Section Subtitle", hint: "" },
    ],
  },
  {
    id: "cta", label: "Bottom CTA Section", icon: <MessageSquare className="w-4 h-4" />, color: "bg-purple-50 border-purple-200",
    fields: [
      { key: "cta_heading", label: "CTA Heading", hint: "" },
      { key: "cta_desc", label: "CTA Description", hint: "" },
    ],
  },
  {
    id: "footer", label: "Footer", icon: <LayoutDashboard className="w-4 h-4" />, color: "bg-slate-50 border-slate-200",
    fields: [
      { key: "footer_tagline", label: "Footer Tagline", hint: "Below the logo" },
      { key: "footer_text", label: "Footer Description Text", hint: "" },
    ],
  },
  {
    id: "support", label: "Support Us Page", icon: <Heart className="w-4 h-4" />, color: "bg-red-50 border-red-200",
    fields: [
      { key: "support_page_intro", label: "Page Introduction", hint: "Top paragraph on the Support Us page" },
      { key: "support_page_payment", label: "Payment Details", hint: "JazzCash / Bank details shown to donors" },
      { key: "support_page_contact_email", label: "Contact Email", hint: "" },
      { key: "support_page_whatsapp", label: "WhatsApp Number", hint: "" },
    ],
  },
];

export function Admin() {
  const { data: user, isLoading } = useGetMe();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "tutors" | "users" | "bookings" | "reviews" | "admins" | "content">("pending");
  const [contentEdits, setContentEdits] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ hero: true });

  const { data: stats } = useQuery<AdminStats>({ queryKey: ["admin-stats"], queryFn: () => apiFetch("/api/admin/stats"), enabled: !!user });
  const { data: pending = [] } = useQuery<AdminTutor[]>({ queryKey: ["admin-pending"], queryFn: () => apiFetch("/api/admin/tutors/pending"), enabled: !!user && tab === "pending" });
  const { data: allTutors = [] } = useQuery<AdminTutor[]>({ queryKey: ["admin-tutors"], queryFn: () => apiFetch("/api/admin/tutors"), enabled: !!user && tab === "tutors" });
  const { data: allUsers = [] } = useQuery<AdminUser[]>({ queryKey: ["admin-users"], queryFn: () => apiFetch("/api/admin/users"), enabled: !!user && tab === "users" });
  const { data: bookings = [] } = useQuery<AdminBooking[]>({ queryKey: ["admin-bookings"], queryFn: () => apiFetch("/api/admin/bookings"), enabled: !!user && tab === "bookings" });
  const { data: reviews = [] } = useQuery<AdminReview[]>({ queryKey: ["admin-reviews"], queryFn: () => apiFetch("/api/admin/reviews"), enabled: !!user && tab === "reviews" });
  const { data: admins = [] } = useQuery<Admin[]>({ queryKey: ["admin-admins"], queryFn: () => apiFetch("/api/admin/admins"), enabled: !!user && tab === "admins" });
  const { data: setupToggle } = useQuery<{ enabled: boolean; adminCount: number }>({ queryKey: ["admin-setup-toggle"], queryFn: () => apiFetch("/api/admin/setup-toggle"), enabled: !!user && tab === "admins" });
  const { data: siteContent = {} } = useQuery<Record<string, string>>({ queryKey: ["site-content-admin"], queryFn: () => apiFetch("/api/content"), enabled: !!user && tab === "content" });

  const approve = useMutation({ mutationFn: (id: number) => apiFetch(`/api/admin/tutors/${id}/approve`, { method: "POST" }), onSuccess: () => { toast({ title: "Approved! ✅" }); qc.invalidateQueries({ queryKey: ["admin-pending"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); }, onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }) });
  const reject = useMutation({ mutationFn: (id: number) => apiFetch(`/api/admin/tutors/${id}/reject`, { method: "POST" }), onSuccess: () => { toast({ title: "Rejected — user notified." }); qc.invalidateQueries({ queryKey: ["admin-pending"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); }, onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }) });
  const deleteUser = useMutation({ mutationFn: (id: number) => apiFetch(`/api/admin/users/${id}`, { method: "DELETE" }), onSuccess: () => { toast({ title: "User removed" }); qc.invalidateQueries({ queryKey: ["admin-users"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); }, onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }) });
  const deleteReview = useMutation({ mutationFn: (id: number) => apiFetch(`/api/admin/reviews/${id}`, { method: "DELETE" }), onSuccess: () => { toast({ title: "Review removed" }); qc.invalidateQueries({ queryKey: ["admin-reviews"] }); }, onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }) });
  const removeAdmin = useMutation({ mutationFn: (id: number) => apiFetch(`/api/admin/admins/${id}`, { method: "DELETE" }), onSuccess: () => { toast({ title: "Admin removed" }); qc.invalidateQueries({ queryKey: ["admin-admins"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); }, onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }) });
  const toggleSetup = useMutation({ mutationFn: (enabled: boolean) => apiFetch("/api/admin/setup-toggle", { method: "POST", body: JSON.stringify({ enabled }) }), onSuccess: () => { toast({ title: "Setup toggle updated" }); qc.invalidateQueries({ queryKey: ["admin-setup-toggle"] }); }, onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }) });

  const getVal = (key: string) => contentEdits[key] ?? siteContent[key] ?? "";

  const saveContent = async (key: string) => {
    const value = getVal(key);
    setSavingKey(key);
    try {
      await apiFetch(`/api/content/${key}`, { method: "POST", body: JSON.stringify({ value }) });
      qc.invalidateQueries({ queryKey: ["site-content"] });
      qc.invalidateQueries({ queryKey: ["site-content-admin"] });
      toast({ title: "Saved! ✅", description: `"${key}" updated on the live site.` });
    } catch (e: any) { toast({ variant: "destructive", title: "Save failed", description: e.message }); }
    finally { setSavingKey(null); }
  };

  const saveSection = async (sectionId: string) => {
    const section = CONTENT_SECTIONS.find(s => s.id === sectionId);
    if (!section) return;
    setSavingAll(true);
    try {
      const updates: Record<string, string> = {};
      section.fields.forEach(f => { updates[f.key] = getVal(f.key); });
      await apiFetch("/api/content", { method: "POST", body: JSON.stringify(updates) });
      qc.invalidateQueries({ queryKey: ["site-content"] });
      qc.invalidateQueries({ queryKey: ["site-content-admin"] });
      toast({ title: `${section.label} saved! ✅`, description: `${section.fields.length} fields updated live.` });
    } catch (e: any) { toast({ variant: "destructive", title: "Save failed", description: e.message }); }
    finally { setSavingAll(false); }
  };

  const saveAllContent = async () => {
    if (Object.keys(contentEdits).length === 0) { toast({ title: "No changes to save." }); return; }
    setSavingAll(true);
    try {
      await apiFetch("/api/content", { method: "POST", body: JSON.stringify(contentEdits) });
      qc.invalidateQueries({ queryKey: ["site-content"] });
      qc.invalidateQueries({ queryKey: ["site-content-admin"] });
      toast({ title: "All changes saved! ✅", description: `${Object.keys(contentEdits).length} fields updated live.` });
      setContentEdits({});
    } catch (e: any) { toast({ variant: "destructive", title: "Save failed", description: e.message }); }
    finally { setSavingAll(false); }
  };

  const toggleSection = (id: string) => setOpenSections(s => ({ ...s, [id]: !s[id] }));
  const isDirty = Object.keys(contentEdits).length > 0;

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4"><ShieldCheck className="w-12 h-12 text-muted-foreground" /><h2 className="font-serif text-2xl font-bold text-primary">Admin Access Required</h2><Link href="/login"><Button className="bg-accent text-accent-foreground">Log in</Button></Link></div>;
  if (!(user as any).isAdmin) return <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4"><ShieldCheck className="w-12 h-12 text-destructive" /><h2 className="font-serif text-2xl font-bold text-primary">Access Denied</h2><Link href="/"><Button variant="outline">Go Home</Button></Link></div>;

  const TABS = [
    { id: "pending" as const, label: "Pending", icon: <Clock className="w-4 h-4" />, count: stats?.pendingTutors },
    { id: "tutors" as const, label: "Tutors", icon: <GraduationCap className="w-4 h-4" />, count: stats?.totalTutors },
    { id: "users" as const, label: "Users", icon: <Users className="w-4 h-4" />, count: stats?.totalUsers },
    { id: "bookings" as const, label: "Bookings", icon: <CalendarCheck className="w-4 h-4" />, count: stats?.totalBookings },
    { id: "reviews" as const, label: "Reviews", icon: <Star className="w-4 h-4" />, count: stats?.totalReviews },
    { id: "admins" as const, label: "Admins", icon: <ShieldCheck className="w-4 h-4" />, count: stats?.adminCount },
    { id: "content" as const, label: "Edit Content", icon: <Edit3 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all border ${tab === t.id ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-primary"}`}>
              {t.icon}{t.label}
              {t.count !== undefined && <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === t.id ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>{t.count}</span>}
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

          {/* Pending */}
          {tab === "pending" && (
            <div className="space-y-4">
              {pending.length === 0 ? <div className="bg-card border border-border rounded-2xl p-12 text-center"><CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" /><p className="font-serif text-xl font-bold text-primary">All caught up!</p><p className="text-muted-foreground text-sm">No pending tutor applications.</p></div>
              : pending.map(t => (
                <div key={t.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif text-lg font-bold text-primary">{t.name}</h3>
                        <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-semibold">Pending</span>
                        {!t.hasPhone && <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><Phone className="w-3 h-3" />No Phone</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{t.email}</p>
                      {t.phone && <p className="text-sm text-primary font-medium flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-accent" />{t.phone}</p>}
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
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-accent/20 rounded-full flex items-center justify-center"><GraduationCap className="w-4 h-4 text-accent" /></div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-primary">{t.name}</p>
                        {!t.hasPhone && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />No Phone</span>}
                        <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${t.isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{t.isApproved ? "Approved" : "Pending"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{t.email}</p>
                      {t.phone && <p className="text-xs text-primary/70 flex items-center gap-1"><Phone className="w-3 h-3" />{t.phone}</p>}
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {t.subject && <span className="text-xs bg-accent/15 text-primary px-1.5 py-0.5 rounded">{t.subject}</span>}
                        {t.level && <span className="text-xs bg-secondary text-primary px-1.5 py-0.5 rounded border border-border">{t.level}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!t.isApproved && <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1 text-xs" onClick={() => approve.mutate(t.id)}><CheckCircle className="w-3.5 h-3.5" />Approve</Button>}
                    {t.isApproved && <Button size="sm" variant="outline" className="border-destructive text-destructive gap-1 text-xs" onClick={() => reject.mutate(t.id)}><XCircle className="w-3.5 h-3.5" />Revoke</Button>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Users */}
          {tab === "users" && (
            <div className="space-y-2">
              {allUsers.map(u => (
                <div key={u.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${u.isAdmin ? "bg-primary" : "bg-muted"}`}>
                      {u.isAdmin ? <ShieldCheck className="w-4 h-4 text-primary-foreground" /> : <Users className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-primary">{u.name}</p>
                        {u.isAdmin && <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold">Admin</span>}
                        <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded capitalize">{u.role}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                      {u.phone && <p className="text-xs text-primary/70 flex items-center gap-1"><Phone className="w-3 h-3" />{u.phone}</p>}
                      {u.grade && <p className="text-xs text-muted-foreground">Grade: {u.grade}{u.age ? ` · Age: ${u.age}` : ""}</p>}
                    </div>
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
              : bookings.map((b: any) => (
                <div key={b.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div><p className="font-medium text-primary text-sm">{b.studentName} → {b.tutorName}</p><p className="text-xs text-muted-foreground">{b.subject} · {b.date} at {b.timeSlot}</p></div>
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
                  <div>
                    <div className="flex items-center gap-2"><p className="font-medium text-sm text-primary">{r.studentName} → {r.tutorName}</p><span className="text-yellow-400 text-sm">{"★".repeat(Math.round(r.rating))}</span><span className="text-xs text-muted-foreground">({r.rating}/5)</span></div>
                    {r.comment && <p className="text-xs text-muted-foreground mt-1">"{r.comment}"</p>}
                    <p className="text-xs text-primary/40 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/5 h-8 w-8 p-0 flex-shrink-0" onClick={() => deleteReview.mutate(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              ))}
            </div>
          )}

          {/* Admins */}
          {tab === "admins" && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h2 className="font-serif text-lg font-bold text-primary flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-accent" />Setup Page Control</h2>
                <p className="text-sm text-muted-foreground">The /setup page allows creating admin accounts. Enable it to allow more admins to register.</p>
                <div className="flex items-center gap-4 p-4 bg-muted/30 border border-border rounded-xl">
                  <div className="flex-1"><p className="font-medium text-primary text-sm">/setup page</p><p className="text-xs text-muted-foreground">{setupToggle?.enabled ? "Open — admins can register" : "Locked"} · {setupToggle?.adminCount ?? 0} admin(s)</p></div>
                  <button onClick={() => toggleSetup.mutate(!setupToggle?.enabled)} disabled={toggleSetup.isPending} className="flex items-center gap-2 text-sm font-semibold text-primary">
                    {setupToggle?.enabled ? <ToggleRight className="w-8 h-8 text-green-500" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                    {setupToggle?.enabled ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h2 className="font-serif text-lg font-bold text-primary">Admin Accounts ({admins.length})</h2>
                <div className="space-y-2">
                  {admins.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 border border-border rounded-xl bg-muted/20">
                      <div className="flex items-center gap-3"><div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-primary-foreground" /></div>
                        <div><p className="font-semibold text-sm text-primary">{a.name}</p><p className="text-xs text-muted-foreground">{a.email}</p></div>
                      </div>
                      {a.id !== (user as any).id && <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/5 h-8 w-8 p-0" onClick={() => { if (confirm(`Remove ${a.name} as admin?`)) removeAdmin.mutate(a.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Enable setup above, then have them register at <strong>/setup</strong>.</p>
              </div>
            </div>
          )}

          {/* Content Editor */}
          {tab === "content" && (
            <div className="space-y-4">
              {/* Header bar */}
              <div className="bg-primary text-primary-foreground rounded-2xl p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-serif text-lg font-bold flex items-center gap-2"><Edit3 className="w-5 h-5 text-accent" />Website Content Editor</p>
                  <p className="text-sm text-primary-foreground/60 mt-0.5">Edit every text on your site. Changes go live instantly — no coding needed.</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isDirty && (
                    <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full font-bold">{Object.keys(contentEdits).length} unsaved</span>
                  )}
                  <Button onClick={saveAllContent} disabled={savingAll || !isDirty}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 font-semibold">
                    <Save className="w-4 h-4" />{savingAll ? "Saving..." : "Save All Changes"}
                  </Button>
                </div>
              </div>

              {/* Sections */}
              {CONTENT_SECTIONS.map(section => {
                const isOpen = !!openSections[section.id];
                const sectionDirty = section.fields.some(f => contentEdits[f.key] !== undefined);
                return (
                  <div key={section.id} className={`border rounded-2xl overflow-hidden ${section.color}`}>
                    <button onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-black/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-primary">{section.icon}</div>
                        <span className="font-semibold text-primary text-sm">{section.label}</span>
                        <span className="text-xs text-muted-foreground">({section.fields.length} fields)</span>
                        {sectionDirty && <span className="text-xs bg-yellow-300 text-yellow-800 px-1.5 py-0.5 rounded-full font-bold">edited</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {isOpen && (
                          <Button size="sm" onClick={e => { e.stopPropagation(); saveSection(section.id); }} disabled={savingAll}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1 text-xs h-7">
                            <Save className="w-3 h-3" />Save Section
                          </Button>
                        )}
                        {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                          <div className="p-4 pt-0 space-y-3">
                            {section.fields.map(field => {
                              const val = getVal(field.key);
                              const isLong = val.length > 80 || field.key.includes("desc") || field.key.includes("p1") || field.key.includes("p2") || field.key.includes("intro") || field.key.includes("payment") || field.key.includes("subtitle");
                              const isDirtyField = contentEdits[field.key] !== undefined;
                              return (
                                <div key={field.key} className="bg-white rounded-xl p-4 space-y-2 shadow-sm border border-white/80">
                                  <div className="flex items-center justify-between gap-2">
                                    <div>
                                      <label className="text-sm font-semibold text-primary block">{field.label}</label>
                                      {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {isDirtyField && <span className="text-[10px] bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded-full font-bold">edited</span>}
                                      <Button size="sm" onClick={() => saveContent(field.key)} disabled={savingKey === field.key}
                                        className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1 text-xs h-7 px-2.5">
                                        <Save className="w-3 h-3" />{savingKey === field.key ? "..." : "Save"}
                                      </Button>
                                    </div>
                                  </div>
                                  {isLong ? (
                                    <textarea
                                      value={val}
                                      onChange={e => setContentEdits(p => ({ ...p, [field.key]: e.target.value }))}
                                      className="w-full border border-border rounded-lg p-2.5 text-sm resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-accent/40 bg-background text-primary"
                                    />
                                  ) : (
                                    <input
                                      value={val}
                                      onChange={e => setContentEdits(p => ({ ...p, [field.key]: e.target.value }))}
                                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 bg-background text-primary"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
