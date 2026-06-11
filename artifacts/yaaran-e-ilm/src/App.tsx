import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { Home } from "@/pages/home";
import { Login } from "@/pages/login";
import { Register } from "@/pages/register";
import { Videos } from "@/pages/videos";
import { Dashboard } from "@/pages/dashboard";
import { Tutors } from "@/pages/tutors";
import { TutorDetail } from "@/pages/tutor-detail";
import { VideoDetail } from "@/pages/video-detail";
import { Classes } from "@/pages/classes";
import { ClassDetail } from "@/pages/class-detail";
import { Upload } from "@/pages/upload";
import { CreateClass } from "@/pages/create-class";
import { MyClasses } from "@/pages/my-classes";
import { MyVideos } from "@/pages/my-videos";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/register" component={Register} />
        <Route path="/login" component={Login} />
        <Route path="/tutors" component={Tutors} />
        <Route path="/tutors/:id" component={TutorDetail} />
        <Route path="/videos" component={Videos} />
        <Route path="/videos/:id" component={VideoDetail} />
        <Route path="/classes" component={Classes} />
        <Route path="/classes/:id" component={ClassDetail} />
        <Route path="/upload" component={Upload} />
        <Route path="/my/classes" component={MyClasses} />
        <Route path="/my/videos" component={MyVideos} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/create-class" component={CreateClass} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;