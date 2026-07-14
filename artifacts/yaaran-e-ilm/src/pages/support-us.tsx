import { useQuery } from "@tanstack/react-query";
import { Heart, Instagram, Link as LinkIcon, MessageCircle, Mail, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
async function apiFetch(path: string) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="ml-2 text-muted-foreground hover:text-accent transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export function SupportUs() {
  const { data: content = {} } = useQuery<Record<string, string>>({ queryKey: ["site-content"], queryFn: () => apiFetch("/api/content") });

  const whatsapp = content["support_page_whatsapp"] ?? "+92 325 7192449";
  const email = content["support_page_contact_email"] ?? "Yaaraneilm@gmail.com";
  const intro = content["support_page_intro"] ?? "Yaaran E Ilm is a free platform providing quality education to every Pakistani student. We run on passion and community support.";
  const paymentDetails = content["support_page_payment"] ?? "JazzCash: 0325-7192449";

  const wa = whatsapp.replace(/\s+/g, "").replace("+", "");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      <div className="text-center space-y-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
          className="w-16 h-16 bg-accent/15 rounded-full mx-auto flex items-center justify-center">
          <Heart className="w-8 h-8 text-accent fill-accent" />
        </motion.div>
        <h1 className="font-serif text-4xl font-bold text-primary">Support Us</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Help us keep free education alive for every Pakistani student.</p>
      </div>

      {/* Mission */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-accent/10 border border-accent/20 rounded-2xl p-8 space-y-3">
        <h2 className="font-serif text-2xl font-bold text-primary">Our Mission</h2>
        <p className="text-muted-foreground leading-relaxed text-lg">{intro}</p>
      </motion.div>

      {/* Contact & Social */}
      <div className="grid md:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-serif text-xl font-bold text-primary">Get in Touch</h2>
          <div className="space-y-3">
            <a href={`mailto:${email}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group">
              <div className="w-9 h-9 bg-accent/15 rounded-xl flex items-center justify-center"><Mail className="w-4 h-4 text-accent" /></div>
              <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm font-medium text-primary group-hover:text-accent transition-colors">{email}</p></div>
            </a>
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 transition-colors group">
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center"><MessageCircle className="w-4 h-4 text-green-600" /></div>
              <div><p className="text-xs text-muted-foreground">WhatsApp</p><p className="text-sm font-medium text-primary">{whatsapp}</p></div>
              <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Chat Now</span>
            </a>
            <a href="https://www.instagram.com/yaaraneilm/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-pink-50 transition-colors group">
              <div className="w-9 h-9 bg-pink-100 rounded-xl flex items-center justify-center"><Instagram className="w-4 h-4 text-pink-600" /></div>
              <div><p className="text-xs text-muted-foreground">Instagram</p><p className="text-sm font-medium text-primary">@yaaraneilm</p></div>
            </a>
            <a href="https://linktr.ee/yaaraneilm" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 transition-colors group">
              <div className="w-9 h-9 bg-accent/15 rounded-xl flex items-center justify-center"><LinkIcon className="w-4 h-4 text-accent" /></div>
              <div><p className="text-xs text-muted-foreground">Linktree</p><p className="text-sm font-medium text-primary">linktr.ee/yaaraneilm</p></div>
            </a>
          </div>
        </motion.div>

        {/* Sponsors */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-serif text-xl font-bold text-primary">Sponsors & Partners</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Are you a company, organisation, or individual who believes in free education? We'd love to collaborate. Reach out and let's discuss how you can be part of this mission.</p>
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-primary">What your support enables:</p>
            {["Server & hosting costs", "Platform improvements", "Outreach to more students", "Educational resources"].map(i => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground"><div className="w-1.5 h-1.5 rounded-full bg-accent" />{i}</div>
            ))}
          </div>
          <a href={`mailto:${email}`}>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.02] transition-all gap-2"><Mail className="w-4 h-4" />Contact for Sponsorship</Button>
          </a>
        </motion.div>
      </div>

      {/* Donations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-serif text-xl font-bold text-primary flex items-center gap-2"><Heart className="w-5 h-5 text-accent" />Send a Donation</h2>
        <p className="text-sm text-muted-foreground">Every contribution, big or small, keeps the lights on and helps us reach more students across Pakistan.</p>
        <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-3">
          <p className="text-sm font-semibold text-primary mb-2">Payment Details:</p>
          {paymentDetails.split("\n").filter(Boolean).map((line, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-primary font-mono bg-background border border-border rounded-lg px-3 py-2">
              <span className="flex-1">{line}</span>
              <CopyButton text={line} />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">After sending a donation, please WhatsApp us with a screenshot so we can acknowledge your contribution. جزاک اللہ خیر 🤲</p>
      </motion.div>
    </motion.div>
  );
}
