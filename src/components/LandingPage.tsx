import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Sparkles, CheckCircle2, Zap, ArrowRight, Eye, Star, HelpCircle, 
  BookOpen, Compass, Award, FileText, Check, Cpu, Download, AlertTriangle 
} from "lucide-react";

interface LandingPageProps {
  onViewChange: (view: string) => void;
  onViewDemo: () => void;
}

export default function LandingPage({ onViewChange, onViewDemo }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const features = [
    {
      icon: <CheckCircle2 className="h-5 w-5 text-[#6366F1]" />,
      title: "ATS Keyword Analyzer",
      desc: "Instantly scan and optimize keyword frequency matching against modern Applicant Tracking System algorithms."
    },
    {
      icon: <Award className="h-5 w-5 text-[#8B5CF6]" />,
      title: "Detailed Resume Scoring",
      desc: "Receive real-time, comprehensive scores across ATS compatibility, skills layout, and professional recruiter readiness."
    },
    {
      icon: <Zap className="h-5 w-5 text-[#06B6D4]" />,
      title: "Job Match Analyzer",
      desc: "Paste live job specifications to calculate exact alignment percentage, missing competencies, and actionable advice."
    },
    {
      icon: <Compass className="h-5 w-5 text-[#8B5CF6]" />,
      title: "Career Roadmap Generation",
      desc: "Enter your target career path to receive structured 30-day, 90-day, and 6-month timelines to level-up."
    },
    {
      icon: <Sparkles className="h-5 w-5 text-[#06B6D4]" />,
      title: "AI Suggestions Coach",
      desc: "Identify and resolve grammatical discrepancies, improper passive bullet structures, and weak resume phrases."
    },
    {
      icon: <Download className="h-5 w-5 text-[#6366F1]" />,
      title: "PDF & MD Report Export",
      desc: "Export generated evaluations and roadmap assets instantly as clean, high-impact PDF digests or standard Markdown."
    }
  ];

  const testimonials = [
    {
      name: "Rohan Patel",
      role: "Software Architect at Vercel",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
      content: "I ran my resume through ResumeAI and polished my keyword frequency density in 10 minutes. Secured my next prime engineering contract within a week!",
      stars: 5
    },
    {
      name: "Lena Dubois",
      role: "Lead UI Developer",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
      content: "The Roadmap generation tool is unbelievably practical. Entering my CSS baseline mapped out a direct progression system with recommended courses.",
      stars: 5
    }
  ];

  const faqs = [
    {
      q: "Do I need to sign up or provide an email?",
      a: "No! ResumeAI is 100% open-source and free. We enforce zero signup walls, logins, or authentication barriers. Simply drag-and-drop your file to analyze its text instantly."
    },
    {
      q: "How does the ATS score calculator check compatibility?",
      a: "Our evaluator parses the document text in-memory. It computes lexical matches, action verb frequency, quantitative indicators, and readability metrics matching systems like Workday, Lever, and Greenhouse."
    },
    {
      q: "Are my uploaded file contents saved anywhere?",
      a: "No file content persists in databases. All resumes are parsed securely in memory during active app lifecycle. Data is processed locally on your client session."
    },
    {
      q: "Which resume file types are supported?",
      a: "ResumeAI provides robust, direct binary parsing for PDF and standard Microsoft Word DOCX files."
    }
  ];

  return (
    <div className="relative min-h-screen grid-glow overflow-x-hidden text-white bg-[#050816]" id="landing-container">
      
      {/* Background radial gradient blobs or glowing orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#6366F1] opacity-10 blur-[130px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute top-[40%] left-[-10%] w-[500px] h-[500px] bg-[#06B6D4] opacity-8 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[550px] h-[550px] bg-[#8B5CF6] opacity-10 blur-[130px] rounded-full pointer-events-none -z-10"></div>

      {/* HERO SECTION */}
      <section className="relative px-4 pt-20 pb-20 sm:px-6 lg:px-8 lg:pt-28 lg:pb-32">
        <div className="mx-auto max-w-5xl text-center space-y-8">
          
          {/* Accent Open Source Ribbon */}
          <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4.5 py-1.5 text-xs font-semibold text-emerald-400 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>100% Free, Secure, & Open-Source AI Resume Platform</span>
          </div>

          <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
            Transform Your Resume Into{" "}
            <span className="bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent block mt-1">
              Interview Opportunities
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm md:text-base text-slate-400 font-sans leading-relaxed">
            Get ATS scores, skill-gap analysis, recruiter feedback, and career recommendations in seconds using AI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto pt-4">
            <button
              onClick={() => onViewChange("dashboard")}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-7 py-3.5 min-h-[48px] text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              id="hero-analyze-btn"
            >
              <span>Analyze Resume</span>
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
            
            <button
              onClick={onViewDemo}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-7 py-3.5 min-h-[48px] text-sm font-semibold text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer"
              id="hero-demo-btn"
            >
              <Eye className="h-4.5 w-4.5 text-[#06B6D4]" />
              <span>View Demo</span>
            </button>
          </div>

          {/* Quick Stats Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Free & Account-Free</span>
            <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-[#06B6D4]" /> Real-time Gemini Feedback</span>
            <span className="flex items-center gap-1.5"><Cpu className="h-4 w-4 text-[#8B5CF6]" /> On-the-fly PDF Parser</span>
          </div>

        </div>
      </section>

      {/* THREE-STEP DEMO PROCESS */}
      <section className="relative px-4 py-12 sm:px-6 lg:px-8 border-t border-b border-white/5 bg-white/1">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="relative glass-panel rounded-2xl p-6 border border-white/5">
              <span className="text-4xl font-extrabold font-display opacity-10 bg-gradient-to-br from-white to-transparent bg-clip-text text-transparent block mb-2">01</span>
              <h3 className="text-base font-bold text-white mb-1">Upload Resume</h3>
              <p className="text-xs text-slate-400">Drag or select your PDF or Word document. Our local parsed handler reads the text instantly in-memory.</p>
            </div>
            <div className="relative glass-panel rounded-2xl p-6 border border-white/5">
              <span className="text-4xl font-extrabold font-display opacity-10 bg-gradient-to-br from-white to-transparent bg-clip-text text-transparent block mb-2">02</span>
              <h3 className="text-base font-bold text-white mb-1">Analyze & Contrast</h3>
              <p className="text-xs text-slate-400">Our engine compares your text, checks technical keyword frequency densities, and benchmarks against positions.</p>
            </div>
            <div className="relative glass-panel rounded-2xl p-6 border border-white/5">
              <span className="text-4xl font-extrabold font-display opacity-10 bg-gradient-to-br from-white to-transparent bg-clip-text text-transparent block mb-2">03</span>
              <h3 className="text-base font-bold text-white mb-1">Receive Output</h3>
              <p className="text-xs text-slate-400">Instantly view optimized circular indicators, weaknesses suggestions, cover letters, and export career roadmaps.</p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPACT INTERACTIVE ATS DEMO PREVIEW (MOCK) */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          
          <div className="lg:col-span-5 space-y-6">
            <span className="bg-indigo-500/10 border border-indigo-500/20 text-[#6366F1] rounded px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-widest inline-block">ATS Match Indicator</span>
            <h2 className="font-display text-2xl md:text-4xl font-extrabold text-white">
              Slam Pass the Modern Recruitment Filters
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Industrial applicant systems automatically filter candidates based on keyword density weights, metric assertions, and role matching indices. ResumeAI evaluates your credentials and highlights optimized gaps in real-time.
            </p>
            <div className="space-y-3 font-sans">
              <div className="flex items-start space-x-2.5">
                <Check className="h-4.5 w-4.5 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-xs sm:text-sm text-slate-350">Grade keyword frequency and domain alignment scores</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <Check className="h-4.5 w-4.5 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-xs sm:text-sm text-slate-350">Receive actionable formula tips matching Google X-Y-Z rules</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <Check className="h-4.5 w-4.5 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-xs sm:text-sm text-slate-350">Generate professional roadmaps structured with certification checklists</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {/* Mock Glassmorphism card dashboard */}
            <div className="glass-panel rounded-2xl p-6.5 border border-white/15 shadow-2xl relative overflow-hidden" id="mockup-dashboard">
              <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-[#6366F1]/10 blur-[50px] pointer-events-none"></div>
              
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Resume Scorecard</h4>
                  <span className="text-[10px] text-slate-500">Evaluating Demo Engineer Resume (PDF)</span>
                </div>
                <div className="rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-2.5 py-0.5 text-[10px] font-mono font-bold">
                  85/100 Score
                </div>
              </div>

              {/* Score indicators */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-semibold">
                    <span className="text-slate-300">ATS Optimization Keyword Hits</span>
                    <span className="text-[#06B6D4] font-mono">80% Optimal</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#6366F1] to-[#06B6D4] rounded-full" style={{ width: "80%" }}></div>
                  </div>
                </div>

                <div className="grid gap-2 text-[10px] font-mono">
                  <div className="flex items-center justify-between bg-white/2 border border-white/5 p-2 rounded-lg">
                    <span className="text-emerald-400">● React / JS hooks</span>
                    <span className="text-slate-500">Good (3 hits)</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/2 border border-white/5 p-2 rounded-lg">
                    <span className="text-amber-500">● Kubernetes Orchestration</span>
                    <span className="text-amber-400">Add Keywords</span>
                  </div>
                </div>

                <div className="bg-[#6366F1]/10 border border-indigo-500/20 p-3 rounded-lg text-xs space-y-1">
                  <span className="font-semibold text-slate-200 block">💡 AI Recruiter Review:</span>
                  <p className="text-slate-400 leading-normal text-[11px]">
                    Rephrase lead accomplishments. Replace passive &quot;responsible for server configuration&quot; with &quot;engineered scale APIs lowering average latency metrics by 20%&quot;.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* COMPREHENSIVE FEATURES SECTION */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 border-t border-white/5 bg-slate-900/30">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="font-display text-2xl md:text-4xl font-extrabold text-white">
              All Advanced Features Fully Unlocked
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
              No subscriptions, no upgrade prompts, and no account requirements. Access pristine tools immediately.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feat, fIdx) => (
              <div 
                key={fIdx} 
                className="glass-panel glass-panel-hover rounded-2xl p-6 border border-white/5 flex flex-col justify-between"
                id={`feat-block-${fIdx}`}
              >
                <div>
                  <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-md">
                    {feat.icon}
                  </div>
                  <h3 className="text-base font-bold font-display text-white mb-1.5">{feat.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl md:text-4xl font-extrabold text-white">Candidate Experiences</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Developers who leveraged ResumeAI to accelerate job offers</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((test, tIdx) => (
            <div key={tIdx} className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
              <div className="flex items-center space-x-3">
                <img 
                  src={test.image} 
                  alt={test.name} 
                  className="h-10 w-10 rounded-full object-cover border border-[#6366F1]/30"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">{test.name}</h4>
                  <span className="text-[10px] text-slate-500 font-medium">{test.role}</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">&quot;{test.content}&quot;</p>
              
              <div className="flex text-amber-500 space-x-1">
                {[...Array(test.stars)].map((_, s) => (
                  <Star key={s} className="h-3 w-3 fill-amber-500 text-amber-500" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQS */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-3xl mx-auto border-t border-white/5">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div key={index} className="glass-panel rounded-xl border border-white/5 overflow-hidden transition-all duration-200">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-4.5 text-left text-xs sm:text-sm font-semibold text-slate-100 hover:bg-white/3 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <HelpCircle className={`h-4.5 w-4.5 text-slate-500 transition-transform ${isOpen ? "rotate-180 text-brand-cyan" : ""}`} />
                </button>
                
                {isOpen && (
                  <div className="p-4.5 pt-0 text-slate-400 text-xs leading-relaxed border-t border-white/3 bg-slate-950/20 font-medium font-sans">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-10 px-4 sm:px-6 lg:px-8 bg-[#050816] text-slate-500 text-[11px]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-display font-semibold text-white tracking-tight">ResumeAI</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-medium">
            <button onClick={() => onViewChange("dashboard")} className="hover:text-white cursor-pointer">Analyze Resume</button>
            <span>•</span>
            <button onClick={() => onViewChange("career-roadmap")} className="hover:text-white cursor-pointer">Career Roadmap</button>
            <span>•</span>
            <button onClick={() => onViewChange("job-match")} className="hover:text-white cursor-pointer">Job Match</button>
          </div>
          <div>
            <span>© 2026 ResumeAI. Free, Open Source, and Account-Free.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
