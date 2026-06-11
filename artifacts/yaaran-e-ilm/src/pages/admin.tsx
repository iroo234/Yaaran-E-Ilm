import { useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  Trash2,
  ShieldCheck,
} from "lucide-react";

type AdminStats = {
  totalUsers: number;
  totalTutors: number;
  pendingTutors: number;
  approvedTutors: number;
  totalClasses: number;
  totalEnrollments: number;
};

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
  createdAt: string;
};

type AdminTutor = {
  id: number;
  userId: number;
  name: string;
  email: string;
  bio: string | null;
  subject: string | null;
  level: string | null;
  isApproved: boolean;
  createdAt: string;
};

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

export function Admin() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"pending" | "tutors" | "users">("pending");

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: () => apiFetch("/api/admin/stats"),
    enabled: !!user,
  });

  const { data: pendingTutors = [], isLoading: pendingLoading } = useQuery<AdminTutor[]>({
    queryKey: ["admin-pending-tutors"],
    queryFn: () => apiFetch("/api/admin/tutors/pending"),
    enabled: !!user && activeTab === "pending",
  });

  const { data: allTutors = [], isLoading: tutorsLoading } = useQuery<AdminTutor[]>({
    queryKey: ["admin-all-tutors"],
    queryFn: () => apiFetch("/api/admin/tutors"),
    enabled: !!user && activeTab === "tutors",
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: () => apiFetch("/api/admin/users"),
    enabled: !!user && activeTab === "users",
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/tutors/${id}/approve`, { method: "POST" }),
    onSuccess: () => {
      toast({ title: "Tutor approved", description: "They are now visible on the platform." });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-tutors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-tutors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/tutors/${id}/reject`, { method: "POST" }),
    onSuccess: () => {
      toast({ title: "Application rejected", description: "The applicant remains as a student." });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-tutors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-tutors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "User removed" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <ShieldCheck className="w-12 h-12 text-muted-foreground" />
        <h2 className="font-serif text-2xl font-bold text-primary">Admin Access Required</h2>
        <p className="text-muted-foreground">Please log in with your admin account.</p>
        <Link href="/login"><Button className="bg-accent text-accent-foreground hover:bg-accent/90">Log in</Button></Link>
      </div>
    );
  }

  if (!(user as any).isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <ShieldCheck className="w-12 h-12 text-destructive" />
        <h2 className="font-serif text-2xl font-bold text-primary">Access Denied</h2>
        <p className="text-muted-foreground">This area is restricted to platform administrators.</p>
        <Link href="/"><Button variant="outline">Go Home</Button></Link>
      </div>
    );
  }

  const tabs = [
    { id: "pending" as const, label: "Pending Approvals", icon: <Clock className="w-4 h-4" />, count: stats?.pendingTutors },
    { id: "tutors" as const, label: "All Tutors", icon: <GraduationCap className="w-4 h-4" />, count: stats?.totalTutors },
    { id: "users" as const, label: "All Users", icon: <Users className="w-4 h-4" />, count: stats?.totalUsers },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-7 h-7 text-accent" />
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-primary-foreground">Admin Dashboard</h1>
              <p className="text-primary-foreground/60 text-sm">Yaaran E Ilm — Platform Management</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: stats?.totalUsers ?? "-", icon: <Users className="w-5 h-5 text-accent" /> },
              { label: "Approved Tutors", value: stats?.approvedTutors ?? "-", icon: <CheckCircle className="w-5 h-5 text-green-400" /> },
              { label: "Pending Review", value: stats?.pendingTutors ?? "-", icon: <Clock className="w-5 h-5 text-yellow-400" /> },
              { label: "Total Classes", value: stats?.totalClasses ?? "-", icon: <BookOpen className="w-5 h-5 text-accent" /> },
            ].map((s) => (
              <div key={s.label} className="bg-primary-foreground/10 rounded-xl p-4 flex items-center gap-3">
                {s.icon}
                <div>
                  <p className="text-2xl font-bold font-serif text-primary-foreground">{s.value}</p>
                  <p className="text-xs text-primary-foreground/60">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-primary"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.id ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Pending Tutors */}
        {activeTab === "pending" && (
          <div className="space-y-4">
            {pendingLoading ? (
              <div className="text-muted-foreground py-12 text-center">Loading pending applications...</div>
            ) : pendingTutors.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <p className="font-serif text-xl font-bold text-primary">All caught up</p>
                <p className="text-muted-foreground text-sm">No pending tutor applications right now.</p>
              </div>
            ) : (
              pendingTutors.map((tutor) => (
                <div key={tutor.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif text-lg font-bold text-primary">{tutor.name}</h3>
                        <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-semibold">
                          Pending
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{tutor.email}</p>
                      <div className="flex gap-3 flex-wrap">
                        {tutor.subject && (
                          <span className="text-xs bg-accent/15 text-primary px-2 py-0.5 rounded-full border border-accent/30">
                            {tutor.subject}
                          </span>
                        )}
                        {tutor.level && (
                          <span className="text-xs bg-secondary text-primary px-2 py-0.5 rounded-full border border-border">
                            {tutor.level}
                          </span>
                        )}
                      </div>
                      {tutor.bio && (
                        <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-accent/30 pl-3 mt-2">
                          {tutor.bio}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Applied {new Date(tutor.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold gap-1.5"
                        onClick={() => approveMutation.mutate(tutor.id)}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive/5 font-semibold gap-1.5"
                        onClick={() => rejectMutation.mutate(tutor.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* All Tutors */}
        {activeTab === "tutors" && (
          <div className="space-y-4">
            {tutorsLoading ? (
              <div className="text-muted-foreground py-12 text-center">Loading tutors...</div>
            ) : allTutors.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <p className="text-muted-foreground">No tutors yet.</p>
              </div>
            ) : (
              allTutors.map((tutor) => (
                <div key={tutor.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-primary">{tutor.name}</p>
                      <p className="text-xs text-muted-foreground">{tutor.email}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {tutor.subject && <span className="text-xs bg-accent/15 text-primary px-2 py-0.5 rounded-full">{tutor.subject}</span>}
                        {tutor.level && <span className="text-xs bg-secondary text-primary px-2 py-0.5 rounded-full">{tutor.level}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${tutor.isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {tutor.isApproved ? "Approved" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!tutor.isApproved && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1" onClick={() => approveMutation.mutate(tutor.id)} disabled={approveMutation.isPending}>
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </Button>
                    )}
                    {tutor.isApproved && (
                      <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/5 gap-1" onClick={() => rejectMutation.mutate(tutor.id)} disabled={rejectMutation.isPending}>
                        <XCircle className="w-3.5 h-3.5" /> Revoke
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* All Users */}
        {activeTab === "users" && (
          <div className="space-y-3">
            {usersLoading ? (
              <div className="text-muted-foreground py-12 text-center">Loading users...</div>
            ) : allUsers.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <p className="text-muted-foreground">No users yet.</p>
              </div>
            ) : (
              allUsers.map((u) => (
                <div key={u.id} className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${u.isAdmin ? "bg-primary" : u.role === "tutor" ? "bg-accent/20" : "bg-secondary"}`}>
                      {u.isAdmin ? (
                        <ShieldCheck className="w-4 h-4 text-primary-foreground" />
                      ) : u.role === "tutor" ? (
                        <GraduationCap className="w-4 h-4 text-accent" />
                      ) : (
                        <Users className="w-4 h-4 text-primary/60" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-primary text-sm">{u.name}</p>
                        {u.isAdmin && <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold">Admin</span>}
                        <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded capitalize">{u.role}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  {!u.isAdmin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/5 flex-shrink-0"
                      onClick={() => {
                        if (confirm(`Remove ${u.name}? This cannot be undone.`)) {
                          deleteUserMutation.mutate(u.id);
                        }
                      }}
                      disabled={deleteUserMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
