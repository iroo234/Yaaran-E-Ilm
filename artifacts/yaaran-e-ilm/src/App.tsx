import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { Home } from "@/pages/home";
import { Login } from "@/pages/login";
import { Register } from "@/pages/register";
import { Dashboard } from "@/pages/dashboard";
import { Tutors } from "@/pages/tutors";
import { TutorDetail } from "@/pages/tutor-detail";
import { Classes } from "@/pages/classes";
import { ClassDetail } from "@/pages/class-detail";
import { CreateClass } from "@/pages/create-class";
import { MyClasses } from "@/pages/my-classes";
import { Admin } from "@/pages/admin";
import { Setup } from "@/pages/setup";
import { Messages } from "@/pages/messages";
import { Resources } from "@/pages/resources";
import { TutorProfileSettings } from "@/pages/tutor-profile-settings";
import { About } from "@/pages/about";
import { Contact } from "@/pages/contact";
import { Privacy } from "@/pages/privacy";
import { Terms } from "@/pages/terms";
import { SupportUs } from "@/pages/support-us";
import { Team } from "@/pages/team";

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
        <Route path="/classes" component={Classes} />
        <Route path="/classes/:id" component={ClassDetail} />
        <Route path="/my/classes" component={MyClasses} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/create-class" component={CreateClass} />
        <Route path="/admin" component={Admin} />
        <Route path="/setup" component={Setup} />
        <Route path="/messages" component={Messages} />
        <Route path="/resources" component={Resources} />
        <Route path="/tutor-settings" component={TutorProfileSettings} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/support-us" component={SupportUs} />
        <Route path="/team" component={Team} />
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
