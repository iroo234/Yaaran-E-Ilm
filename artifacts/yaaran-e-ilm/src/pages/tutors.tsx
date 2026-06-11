import { useState } from "react";
import { Link } from "wouter";
import { useListTutors } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Star, Users, Video as VideoIcon, BookOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SUBJECTS = ["All Subjects", "Mathematics", "Physics", "Chemistry", "Biology", "English", "Urdu", "History", "Geography", "Computer Science", "Economics", "Accounting", "Islamic Studies"];
const LEVELS = ["All Levels", "O Level", "A Level", "Matric", "FSC", "Primary", "Middle"];

export function Tutors() {
  const [subject, setSubject] = useState<string>("All Subjects");
  const [level, setLevel] = useState<string>("All Levels");
  const [search, setSearch] = useState("");

  const params: any = {};
  if (subject !== "All Subjects") params.subject = subject;
  if (level !== "All Levels") params.level = level;

  const { data: tutors, isLoading } = useListTutors(params);

  const filteredTutors = tutors?.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    (t.bio && t.bio.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl">
      <div className="mb-10">
        <h1 className="text-4xl font-serif font-bold text-primary mb-4">Find a Tutor</h1>
        <p className="text-lg text-muted-foreground">Discover expert educators tailored to your academic needs.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input 
            placeholder="Search tutors by name..." 
            className="pl-10 text-lg py-6"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-full md:w-[200px] py-6">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-full md:w-[200px] py-6">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="animate-pulse bg-muted h-64 rounded-xl" />)}
        </div>
      ) : filteredTutors?.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-2xl border border-border/50">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-primary mb-2">No tutors found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutors?.map(tutor => (
            <Link key={tutor.id} href={`/tutors/${tutor.id}`}>
              <Card className="hover-elevate cursor-pointer h-full border-border/50 transition-all flex flex-col group">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="w-16 h-16 border-2 border-primary/10 group-hover:border-primary/30 transition-colors">
                      <AvatarImage src={tutor.avatarUrl || undefined} />
                      <AvatarFallback className="text-xl bg-primary/5 text-primary">{tutor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-primary truncate">{tutor.name}</h3>
                      <div className="flex items-center text-accent font-medium mt-1">
                        <Star className="w-4 h-4 mr-1 fill-current" />
                        {tutor.rating ? tutor.rating.toFixed(1) : "New"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap mb-4">
                    {tutor.subject && <Badge variant="secondary" className="bg-secondary/10 text-secondary border-0">{tutor.subject}</Badge>}
                    {tutor.level && <Badge variant="outline" className="border-border/50">{tutor.level}</Badge>}
                  </div>
                  
                  <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1">
                    {tutor.bio || "An experienced educator on Yaaran E Ilm."}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2 border-t border-border/40 pt-4 mt-auto">
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">{tutor.totalStudents}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Users className="w-3 h-3"/> Students</div>
                    </div>
                    <div className="text-center border-l border-r border-border/40">
                      <div className="text-lg font-bold text-primary">{tutor.totalClasses}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><BookOpen className="w-3 h-3"/> Classes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">{tutor.totalVideos}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><VideoIcon className="w-3 h-3"/> Videos</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}