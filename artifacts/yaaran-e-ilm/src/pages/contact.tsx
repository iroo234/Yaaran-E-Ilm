import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, MapPin } from "lucide-react";

export function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10 space-y-3">
        <h1 className="font-serif text-4xl font-bold text-primary">Contact Us</h1>
        <p className="text-muted-foreground">Have questions? We'd love to hear from you.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            {[
              { icon: <Mail className="w-5 h-5 text-accent" />, label: "Email", value: "support@yaaraneilm.com" },
              { icon: <MessageSquare className="w-5 h-5 text-accent" />, label: "WhatsApp", value: "+92 300 0000000" },
              { icon: <MapPin className="w-5 h-5 text-accent" />, label: "Based in", value: "Pakistan 🇵🇰" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-accent/15 rounded-xl flex items-center justify-center flex-shrink-0">{item.icon}</div>
                <div><p className="text-xs text-muted-foreground">{item.label}</p><p className="text-sm font-medium text-primary">{item.value}</p></div>
              </div>
            ))}
          </div>
          <div className="bg-accent/10 border border-accent/20 rounded-2xl p-6">
            <h3 className="font-serif text-lg font-bold text-primary mb-2">Response Time</h3>
            <p className="text-sm text-muted-foreground">We respond to all messages within 24 hours, Monday to Saturday.</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          {sent ? (
            <div className="text-center py-8 space-y-3">
              <div className="text-4xl">✅</div>
              <h3 className="font-serif text-xl font-bold text-primary">Message sent!</h3>
              <p className="text-muted-foreground text-sm">We'll get back to you within 24 hours.</p>
              <Button variant="outline" onClick={() => setSent(false)}>Send another</Button>
            </div>
          ) : (
            <>
              <h2 className="font-serif text-lg font-bold text-primary">Send a Message</h2>
              <div className="space-y-1.5"><Label>Your Name</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Ahmed Khan" /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="ahmed@example.com" /></div>
              <div className="space-y-1.5"><Label>Message</Label><textarea value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} placeholder="How can we help you?" className="w-full border border-border rounded-xl p-3 text-sm resize-none h-32 focus:outline-none focus:ring-2 focus:ring-accent/40 bg-background" /></div>
              <Button onClick={() => setSent(true)} disabled={!form.name || !form.email || !form.message} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Send Message</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
