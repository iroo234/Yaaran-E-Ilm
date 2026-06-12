import { useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Upload, Download, Trash2, Filter, FileText, ExternalLink } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Error" })); throw new Error(e.error ?? "Request failed"); }
  return res.json();
}

type Resource = { id: number; uploaderId: number; title: string; description?: string; fileUrl: string; fileType: string; subject?: string; level?: string; downloads: number; createdAt: string; uploaderName: string; uploaderRole: string; };

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Urdu", "Computer Science", "Economics", "History", "Geography"];
const LEVELS = ["O Level", "A Level", "Matric", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

export function Resources() {
  const { data: user } = useGetMe();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", fileUrl: "", fileType: "pdf", subject: "", level: "" });

  const { data: resources = [], isLoading } = useQuery<Resource[]>({
    queryKey: ["resources", subject, level],
    queryFn: () => apiFetch(`/api/resources?${subject ? `subject=${encodeURIComponent(subject)}&` : ""}${level ? `level=${encodeURIComponent(level)}` : ""}`),
  });

  const uploadMutation = useMutation({
    mutationFn: () => apiFetch("/api/resources", { method: "POST", body: JSON.stringify(form) }),
    onSuccess: () => { toast({ title: "Resource uploaded!" }); qc.invalidateQueries({ queryKey: ["resources"] }); setShowUpload(false); setForm({ title: "", description: "", fileUrl: "", fileType: "pdf", subject: "", level: "" }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/resources/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast({ title: "Deleted" }); qc.invalidateQueries({ queryKey: ["resources"] }); },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const userId = (user as any)?.id;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-primary flex items-center gap-2"><BookOpen className="w-7 h-7 text-accent" />Study Resources</h1>
          <p className="text-muted-foreground mt-1">Free notes, PDFs and study material shared by the community</p>
        </div>
        {user ? (
          <Button onClick={() => setShowUpload(!showUpload)} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"><Upload className="w-4 h-4" />Share Resource</Button>
        ) : (
          <Link href="/login"><Button variant="outline" className="gap-2"><Upload className="w-4 h-4" />Log in to Upload</Button></Link>
        )}
      </div>

      {/* Upload Form */}
      {showUpload && user && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-8 space-y-4">
          <h2 className="font-serif text-lg font-bold text-primary">Upload a Resource</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g., O Level Maths Past Papers 2024" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>File URL * <span className="text-xs text-muted-foreground">(Google Drive / Dropbox public link)</span></Label>
              <Input value={form.fileUrl} onChange={e => setForm(f => ({...f, fileUrl: e.target.value}))} placeholder="https://drive.google.com/..." />
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <select value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-primary focus:outline-none focus:ring-2 focus:ring-accent/40">
                <option value="">Any subject</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Level</Label>
              <select value={form.level} onChange={e => setForm(f => ({...f, level: e.target.value}))} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-primary focus:outline-none focus:ring-2 focus:ring-accent/40">
                <option value="">Any level</option>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Brief description of the resource..." />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending || !form.title || !form.fileUrl} className="bg-accent text-accent-foreground hover:bg-accent/90">{uploadMutation.isPending ? "Uploading..." : "Upload Resource"}</Button>
            <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Filter className="w-4 h-4" /> Filter:</div>
        <select value={subject} onChange={e => setSubject(e.target.value)} className="border border-border rounded-xl px-3 py-1.5 text-sm bg-background text-primary focus:outline-none focus:ring-2 focus:ring-accent/40">
          <option value="">All Subjects</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={level} onChange={e => setLevel(e.target.value)} className="border border-border rounded-xl px-3 py-1.5 text-sm bg-background text-primary focus:outline-none focus:ring-2 focus:ring-accent/40">
          <option value="">All Levels</option>
          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        {(subject || level) && <Button variant="ghost" size="sm" onClick={() => { setSubject(""); setLevel(""); }} className="text-muted-foreground hover:text-primary">Clear</Button>}
      </div>

      {/* Resources Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading resources...</div>
      ) : resources.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="font-serif text-xl font-bold text-primary">No resources found</p>
          <p className="text-muted-foreground text-sm">Be the first to share study material!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col gap-3 hover:border-accent/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-primary text-sm leading-tight line-clamp-2">{r.title}</h3>
                  {r.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.subject && <span className="text-xs bg-accent/15 text-primary px-2 py-0.5 rounded-full">{r.subject}</span>}
                {r.level && <span className="text-xs bg-secondary text-primary px-2 py-0.5 rounded-full border border-border">{r.level}</span>}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>By {r.uploaderName} · {r.uploaderRole}</span>
                <span className="flex items-center gap-1"><Download className="w-3 h-3" />{r.downloads}</span>
              </div>
              <div className="flex gap-2 mt-auto">
                <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button size="sm" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-1 text-xs"><ExternalLink className="w-3.5 h-3.5" />Open</Button>
                </a>
                {(userId === r.uploaderId || (user as any)?.isAdmin) && (
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/5 px-2" onClick={() => deleteMutation.mutate(r.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
