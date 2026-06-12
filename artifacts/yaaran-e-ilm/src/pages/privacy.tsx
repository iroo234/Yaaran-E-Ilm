export function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="font-serif text-4xl font-bold text-primary">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: June 2026</p>
      </div>
      {[
        { title: "Information We Collect", content: "We collect your name, email address, and role (student or tutor) when you register. We also collect booking requests, messages, reviews, and any resources you upload to the platform." },
        { title: "How We Use Your Information", content: "Your information is used to operate the platform: connecting students with tutors, processing session bookings, and enabling in-app messaging. We do not sell your data to third parties." },
        { title: "Data Security", content: "Passwords are hashed and never stored in plain text. All data is transmitted over HTTPS. Access to personal data is restricted to you and the parties you communicate with." },
        { title: "Cookies", content: "We use session cookies to keep you logged in. No advertising or tracking cookies are used." },
        { title: "Your Rights", content: "You may request deletion of your account and all associated data at any time by contacting us at support@yaaraneilm.com." },
        { title: "Contact", content: "For privacy-related questions, contact us at support@yaaraneilm.com." },
      ].map(section => (
        <div key={section.title} className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-primary">{section.title}</h2>
          <p className="text-muted-foreground leading-relaxed">{section.content}</p>
        </div>
      ))}
    </div>
  );
}
