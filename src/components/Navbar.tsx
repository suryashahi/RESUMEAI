import React, { useState } from "react";
import { 
  Sparkles, LayoutDashboard, Briefcase, FileText, Compass, Menu, X 
} from "lucide-react";

interface NavbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Navbar({ currentView, onViewChange }: NavbarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navItems = [
    { view: "dashboard", label: "Resume Analyzer", compactLabel: "Dashboard", icon: <LayoutDashboard className="h-4 w-4 text-[#6366F1]" /> },
    { view: "job-match", label: "Job Matcher", compactLabel: "Matcher", icon: <Briefcase className="h-4 w-4 text-[#06B6D4]" /> },
    { view: "career-roadmap", label: "Career Roadmap", compactLabel: "Roadmap", icon: <Compass className="h-4 w-4 text-[#8B5CF6]" /> },
    { view: "resume-builder", label: "Bullet Architect", compactLabel: "Bullets", icon: <FileText className="h-4 w-4 text-[#EF4444]" /> },
    { view: "cover-letter", label: "Cover Letter", compactLabel: "Letters", icon: <Sparkles className="h-4 w-4 text-amber-400" /> },
  ];

  const handleNavClick = (view: string) => {
    onViewChange(view);
    setIsDrawerOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-white/5 bg-[#050816]/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={() => handleNavClick("landing")}
            className="flex cursor-pointer items-center space-x-2 sm:space-x-2.5 hover:opacity-90 transition-opacity"
            id="nav-logo-btn"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] shadow-lg shadow-indigo-500/20 shrink-0">
              <Sparkles className="h-4.5 w-4.5 text-white animate-pulse" />
            </div>
            <span className="font-display text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              ResumeAI
            </span>
            <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-1.5 sm:px-2 py-0.5 font-mono text-[9px] sm:text-[10px] tracking-wider text-emerald-400 font-bold uppercase shrink-0">
              Open
            </span>
          </div>

          {/* Desktop Navigation Links (Visible on 1024px+ / lg:flex) */}
          <div className="hidden lg:flex items-center space-x-1" id="desktop-nav">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  currentView === item.view || (item.view === "dashboard" && currentView === "analysis")
                    ? "bg-white/8 text-white font-semibold shadow-inner border border-white/5"
                    : "text-slate-440 hover:text-white hover:bg-white/4"
                }`}
                id={`nav-${item.view}-btn`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Tablet Navigation Links (Visible on 768px - 1023px / md:flex lg:hidden) */}
          <div className="hidden md:flex lg:hidden items-center space-x-1" id="tablet-nav">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                className={`flex items-center space-x-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  currentView === item.view || (item.view === "dashboard" && currentView === "analysis")
                    ? "bg-white/8 text-white font-semibold shadow-inner border border-white/5"
                    : "text-slate-400 hover:text-white hover:bg-white/4"
                }`}
                id={`nav-tablet-${item.view}-btn`}
              >
                {item.icon}
                <span>{item.compactLabel}</span>
              </button>
            ))}
          </div>

          {/* Right Action side & Mobile Hamburger Trigger */}
          <div className="flex items-center space-x-2">
            <div className="hidden xl:flex items-center space-x-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1 text-xs text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#6366F1] animate-pulse"></span>
              <span>Gemini 2.5 Flash</span>
            </div>
            
            <button
              onClick={() => handleNavClick("dashboard")}
              className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:brightness-110 active:scale-95 px-3 sm:px-4.5 py-2 rounded-lg text-xs font-semibold text-white transition-all shadow-md shadow-indigo-500/10 cursor-pointer min-h-[40px] sm:min-h-0 flex items-center"
            >
              Analyze Resume
            </button>

            {/* Mobile Hamburger Button (Visible on screens < 768px / md:hidden) */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex md:hidden items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer h-10 w-10 shrink-0"
              aria-label="Toggle navigation menu"
              id="mobile-hamburger-trigger"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

        </div>
      </div>

      {/* Slide-in Mobile Drawer with Backdrop Blur Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" id="mobile-nav-drawer-portal">
          
          {/* Backdrop blur overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
            onClick={() => setIsDrawerOpen(false)}
            id="mobile-drawer-backdrop"
          />

          {/* Drawer sheet */}
          <div 
            className="relative w-full max-w-xs h-full bg-[#050816] border-l border-white/10 p-6 shadow-2xl flex flex-col justify-between z-10 overflow-y-auto"
            id="mobile-drawer-sheet"
          >
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6]">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-display font-bold text-white text-base">ResumeAI</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer h-9 w-9 flex items-center justify-center"
                  id="mobile-drawer-close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Vertical Navigation Links - Touch Friendly Minimum 48px Height */}
              <div className="flex flex-col space-y-1.5 font-sans">
                {navItems.map((item) => (
                  <button
                    key={item.view}
                    onClick={() => handleNavClick(item.view)}
                    className={`w-full flex items-center space-x-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer min-h-[48px] ${
                      currentView === item.view || (item.view === "dashboard" && currentView === "analysis")
                        ? "bg-white/10 text-white shadow-inner border border-white/5"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                    id={`drawer-${item.view}-btn`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Drawer Footer */}
            <div className="pt-6 border-t border-white/5 space-y-4 font-mono">
              <div className="flex items-center space-x-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-2 text-xs text-slate-350 w-full justify-center">
                <span className="w-2 h-2 rounded-full bg-[#6366F1] animate-pulse"></span>
                <span>Gemini 2.5 Active</span>
              </div>
              <p className="text-[10px] text-center text-slate-500">
                © 2026 ResumeAI. Open Source.
              </p>
            </div>

          </div>
        </div>
      )}
    </nav>
  );
}
