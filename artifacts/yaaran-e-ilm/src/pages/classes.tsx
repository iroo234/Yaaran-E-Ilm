import { useState } from "react";
import { Link } from "wouter";
import { useListClasses } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Users, Calendar, Clock, BookOpen, Video } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const SUBJECTS = ["All Subjects", "Mathematics", "Physics", "Chemistry", "Biology", "English", "Urdu", "History", "Geography", "Computer Science", "Economics", "Accounting", "Islamic Studies"];
const LEVELS = ["All Levels", "O Level", "A Level", "Matric", "FSC", "Primary", "Middle"];

export function Classes() {
  const [subject, setSubject] = useState<string>("All Subjects");
  const [level, setLevel] = useState<string>("All Levels");
  const [search, setSearch] = useState("");

  const params: any = {};
  if (subject !== "All Subjects") params.subject = subject;
  if (level !== "All Levels") params.level = level;

  const { data: classes, isLoading } = useListClasses(params);

  const filteredClasses = classes?.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    c.tutorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-primary mb-4">Live Classes</h1>
          <p className="text-lg text-muted-foreground">Enroll in interactive sessions with expert tutors.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input 
            placeholder="Search classes or tutors..." 
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse bg-muted h-48 rounded-xl" />)}
        </div>
      ) : filteredClasses?.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-2xl border border-border/50">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-primary mb-2">No classes found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredClasses?.map(cls => (
            <Card key={cls.id} className="hover-elevate border-border/50 overflow-hidden flex flex-col">
              <CardContent className="p-0 flex flex-col sm:flex-row h-full">
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2 mb-3">
                        {cls.subject && <Badge variant="secondary" className="bg-secondary/10 text-secondary border-0">{cls.subject}</Badge>}
                        {cls.level && <Badge variant="outline">{cls.level}</Badge>}
                      </div>
                      <Badge variant={cls.status === "open" ? "default" : "secondary"} className={cls.status === "open" ? "bg-green-600 hover:bg-green-600" : ""}>
                        {cls.status.toUpperCase()}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-2">{cls.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mb-4">
                      <span className="font-medium text-foreground">By {cls.tutorName}</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent" />
                      <span className="truncate">{cls.schedule || "TBD"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent" />
                      <span>{cls.enrolledCount} / {cls.maxStudents} enrolled</span>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/30 p-6 sm:w-48 flex flex-col sm:border-l border-t sm:border-t-0 border-border/50 justify-between items-center text-center">
                  <div className="mb-4">
                    <div className="text-sm text-muted-foreground mb-1">Price</div>
                    <div className="text-2xl font-bold text-primary">
                      {cls.isFree ? "Free" : `Rs ${cls.price}`}
                    </div>
                  </div>
                  <Link href={`/classes/${cls.id}`} className="w-full">
                    <Button className="w-full">Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}