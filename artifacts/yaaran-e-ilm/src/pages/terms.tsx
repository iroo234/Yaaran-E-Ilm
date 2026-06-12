export function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="font-serif text-4xl font-bold text-primary">Terms of Use</h1>
        <p className="text-muted-foreground">Last updated: June 2026</p>
      </div>
      {[
        { title: "Acceptance", content: "By using Yaaran E Ilm, you agree to these terms. If you do not agree, please do not use the platform." },
        { title: "Eligibility", content: "You must be at least 13 years old to use this platform. Users under 18 should have parental consent." },
        { title: "Tutor Conduct", content: "Tutors must provide honest information about their qualifications. All tutors are vetted and approved by our admin team before appearing publicly." },
        { title: "Prohibited Behaviour", content: "Harassment, abuse, sharing inappropriate content, or using the platform for commercial spam is strictly prohibited and will result in immediate account suspension." },
        { title: "Content Ownership", content: "You retain ownership of any resources or content you upload. By uploading, you grant Yaaran E Ilm a non-exclusive licence to display that content on the platform." },
        { title: "Payments", content: "Tutors set their own rates. The platform takes a 20% commission on paid sessions. Free sessions involve no charges. Payment disputes should be reported to support@yaaraneilm.com." },
        { title: "Limitation of Liability", content: "Yaaran E Ilm is a platform that connects students and tutors. We are not responsible for the quality of tutoring sessions or outcomes. We facilitate connections but do not guarantee results." },
        { title: "Changes", content: "We may update these terms. Continued use of the platform after changes constitutes acceptance of the new terms." },
      ].map(section => (
        <div key={section.title} className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-primary">{section.title}</h2>
          <p className="text-muted-foreground leading-relaxed">{section.content}</p>
        </div>
      ))}
    </div>
  );
}
