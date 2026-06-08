import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Sparkles, FileText, Check, Plus, RefreshCw, AlertCircle, Edit2, 
  Trash2, Printer, Eye, Settings, HelpCircle, Download 
} from "lucide-react";
import { ResumeBuilderData } from "../types";

interface ResumeBuilderToolProps {
  onGenerate: (experience: string, skills: string, role: string) => Promise<ResumeBuilderData>;
}

export default function ResumeBuilderTool({
  onGenerate,
}: ResumeBuilderToolProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Form input states
  const [role, setRole] = useState("Senior Fullstack Developer");
  const [rawExperience, setRawExperience] = useState("Built database systems using Node.js. Guided a junior dev unit of three people. Accelerated responsiveness results.");
  const [rawSkills, setRawSkills] = useState("React, Node.js, Express, PostgreSQL, Redis, Cloud Architecture");

  const [activeTemplate, setActiveTemplate] = useState<"modern" | "classic" | "minimal">("modern");
  const [resumeData, setResumeData] = useState<ResumeBuilderData | null>(null);

  // Editing utilities
  const [isEditing, setIsEditing] = useState(false);

  const handleGenerateCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const generated = await onGenerate(rawExperience, rawSkills, role);
      setResumeData(generated);
    } catch (err: any) {
      setErrorMsg("Failed to generate resume draft: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick preset loader mock triggers to save users massive manual typing
  const loadPreset = () => {
    setRole("Senior React Engineer");
    setRawExperience("Crafted responsive client dashboards. Handled layout scaling bugs. Transitioned state engines from legacy structures to high-performance containers.");
    setRawSkills("React 19, TypeScript, Framer Motion, Tailwind CSS, Jest, GraphQL");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8" id="resume-builder-container">
      
      {/* TITLE INTRO */}
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white font-display flex items-center space-x-2.5">
          <FileText className="h-5.5 w-5.5 text-brand-indigo shrink-0" />
          <span>Generative Resume Section Builder</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 font-sans">
          Input your raw experience details and let the engine architect high-impact quantifiable bullet achievements instantly.
        </p>
      </div>

      {/* CONTENT ACTION WRAP */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* INPUT FORM BLOCK */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleGenerateCall} className="glass-card rounded-2xl p-6 border border-white/10 space-y-5 shadow-lg">
            
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-xs uppercase font-mono tracking-widest font-bold text-slate-400">Builder Configurator</span>
              <button 
                type="button" 
                onClick={loadPreset}
                className="text-xs text-brand-indigo hover:underline transition-all"
                id="builder-load-preset-btn"
              >
                Load Preset Profile
              </button>
            </div>

            {/* TARGET ROLE */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">Target Job Title</label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Frontend Developer"
                className="w-full glass-input rounded-xl px-4 py-2 text-xs"
                id="builder-input-role"
              />
            </div>

            {/* RAW CHRONOLOGY */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="block font-semibold text-slate-400 uppercase tracking-widest">Raw Experiences / Jobs</label>
                <span className="text-slate-600">Draft your raw notes below</span>
              </div>
              <textarea
                required
                value={rawExperience}
                onChange={(e) => setRawExperience(e.target.value)}
                placeholder="Discuss your raw achievements or prior tasks (e.g., responsible for databases, guided devs, resolved scaling issues, optimized frontend responsiveness)..."
                className="w-full glass-input rounded-xl p-3.5 text-xs h-32 font-sans leading-relaxed resize-none"
                id="builder-input-exps"
              />
            </div>

            {/* RAW SKILLS */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">Core skills grid</label>
              <input
                type="text"
                required
                value={rawSkills}
                onChange={(e) => setRawSkills(e.target.value)}
                placeholder="React, CSS, AWS, SQL (separated by commas)"
                className="w-full glass-input rounded-xl px-4 py-2.5 text-xs"
                id="builder-input-skills"
              />
            </div>

            {errorMsg && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SUBMIT HERO */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 min-h-[48px] rounded-xl bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-cyan hover:brightness-110 font-bold text-xs sm:text-sm text-white shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              id="builder-submit"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                  <span>Synthesizing custom metric bullets...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4.5 w-4.5 text-white" />
                  <span>Generate AI Template Draft</span>
                </>
              )}
            </button>
          </form>

          {/* CHOOSE SYSTEM TEMPLATES */}
          <div className="glass-panel border-white/10 rounded-2xl p-5 space-y-3.5 shadow-sm">
            <span className="text-xs uppercase font-mono tracking-widest font-bold text-slate-400 block">Templates Style Presets</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
              {[
                { type: "modern", label: "Swiss Modern" },
                { type: "classic", label: "Classic Serif" },
                { type: "minimal", label: "Developer Mono" }
              ].map((temp) => (
                <button
                  key={temp.type}
                  onClick={() => setActiveTemplate(temp.type as any)}
                  className={`py-2 px-1 rounded-lg border text-center font-semibold transition-all cursor-pointer ${
                    activeTemplate === temp.type
                      ? "border-brand-indigo bg-brand-indigo/10 text-brand-indigo"
                      : "border-white/5 bg-white/2 text-slate-400 hover:text-white"
                  }`}
                >
                  {temp.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* INTERACTIVE PREVIEW OUTPUT BOARD */}
        <div className="lg:col-span-7">
          {resumeData ? (
            <div className="space-y-4" id="resume-document-workspace-preview">
              
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/3 border border-white/10 p-3 rounded-xl select-none">
                <span className="text-xs text-brand-cyan font-mono font-bold flex items-center gap-1.5 justify-center sm:justify-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse"></span>
                  Live Document Draft Ready
                </span>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex-1 sm:flex-none p-2 sm:p-1 px-3 min-h-[40px] sm:min-h-0 border border-white/5 bg-white/2 hover:bg-white/5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer flex items-center justify-center"
                    id="builder-edit-btn"
                  >
                    {isEditing ? "Apply Edits" : "Edit Values Custom"}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 sm:flex-none p-2 sm:p-1.5 px-3 min-h-[40px] sm:min-h-0 rounded-lg bg-brand-indigo hover:brightness-110 text-xs font-bold text-white shadow flex items-center justify-center space-x-1 transition-all cursor-pointer"
                    id="builder-print-btn"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print PDF</span>
                  </button>
                </div>
              </div>

              {/* DYNAMIC TEMPLATE SHEETS VIEW REPRESENTING REAL PAGES */}
              <div 
                className={`rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 border text-slate-800 ${
                  activeTemplate === "modern" 
                    ? "bg-slate-50 border-slate-200 font-sans tracking-tight" 
                    : activeTemplate === "classic"
                    ? "bg-amber-50/15 text-slate-100 border-white/12 font-serif"
                    : "bg-stone-900 text-stone-100 border-white/10 font-mono text-xs leading-relaxed"
                }`}
                id="visual-resume-card"
              >
                
                {/* NAME SUBHEADERS */}
                <div className="text-center border-b pb-4 mb-4 border-slate-300/60 flex flex-col items-center">
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900 uppercase font-display select-all">
                    Candidate Developer Name
                  </h3>
                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 mt-1 font-mono">
                    <span>sambhavhoraa@gmail.com</span>
                    <span>•</span>
                    <span>Github: dev-bde3</span>
                    <span>•</span>
                    <span>Singapore / Remote Work</span>
                  </div>
                </div>

                {/* SUMMARY ROW */}
                <div className="space-y-1.5 mb-5">
                  <h4 className="text-[11px] uppercase font-bold tracking-widest text-[#6366F1] font-mono">Executive Summary</h4>
                  {isEditing ? (
                    <textarea
                      value={resumeData.summary}
                      onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                      className="w-full bg-white/8 text-slate-900 border border-slate-300 rounded p-2 text-xs"
                    />
                  ) : (
                    <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed text-justify">{resumeData.summary}</p>
                  )}
                </div>

                {/* EXPERIENCE SECTION */}
                <div className="space-y-4 mb-5">
                  <h4 className="text-[11px] uppercase font-bold tracking-widest text-[#6366F1] font-mono border-b pb-0.5 border-slate-350">Professional Accomplishments</h4>
                  
                  {resumeData.experience && resumeData.experience.map((exp, expIdx) => (
                    <div key={expIdx} className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-baseline font-bold text-slate-900">
                        <span>{exp.company} — <strong className="text-slate-600 font-medium">{exp.role}</strong></span>
                        <span className="font-mono font-medium text-slate-500 text-[10px]">{exp.duration}</span>
                      </div>

                      <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        {exp.bullet_points.map((bullet, blIdx) => (
                          <li key={blIdx} className="leading-relaxed text-justify">
                            {isEditing ? (
                              <input
                                type="text"
                                value={bullet}
                                onChange={(e) => {
                                  const updatedExp = [...resumeData.experience];
                                  updatedExp[expIdx].bullet_points[blIdx] = e.target.value;
                                  setResumeData({ ...resumeData, experience: updatedExp });
                                }}
                                className="w-full bg-white/8 border border-slate-300 rounded p-1 text-xs"
                              />
                            ) : (
                              bullet
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* SKILLS COLUMN */}
                <div className="space-y-1.5 mb-5">
                  <h4 className="text-[11px] uppercase font-bold tracking-widest text-[#6366F1] font-mono">Core technical expertise</h4>
                  <p className="text-xs text-slate-705 font-mono">
                    {resumeData.skills ? resumeData.skills.join(" • ") : "None defined"}
                  </p>
                </div>

                {/* EDUCATION SUMMARY */}
                <div className="space-y-2">
                  <h4 className="text-[11px] uppercase font-bold tracking-widest text-[#6366F1] font-mono">Academic Trajectory</h4>
                  {resumeData.education && resumeData.education.map((edu, edIdx) => (
                    <div key={edIdx} className="flex justify-between font-medium text-xs text-slate-700">
                      <span>{edu.institution} — <span className="text-slate-500">{edu.degree}</span></span>
                      <span className="font-mono text-slate-500">{edu.year}</span>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          ) : (
            /* EMPTY VIEW */
            <div className="h-full min-h-[350px] flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl bg-slate-950/20 text-slate-500 text-center px-6">
              <Eye className="h-10 w-10 text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-white font-display mb-1">Live Document preview Canvas</h3>
              <p className="text-xs max-w-sm">
                Insert your current target title and prior work notes on the configurator form, then click synthesis to render professional resume drafts.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
