import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Sparkles, Briefcase, ChevronRight, CheckCircle2, AlertCircle, FileText, 
  Target, Award, RefreshCw, Layers, Check 
} from "lucide-react";
import { JobMatchData } from "../types";

interface JobMatchToolProps {
  resumeText: string;
  onRunMatch: (jobDesc: string) => Promise<any>;
  latestMatchResult: JobMatchData | null;
}

export default function JobMatchTool({
  resumeText,
  onRunMatch,
  latestMatchResult,
}: JobMatchToolProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleMatchCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText) {
      setErrorMsg("Please upload watermarked resume contents in the Dashboard before matching.");
      return;
    }
    if (!jobDescription || jobDescription.trim().length < 50) {
      setErrorMsg("Please provide a sufficiently detailed Target Job description (minimum 50 characters).");
      return;
    }

    setErrorMsg("");
    setLoading(true);
    try {
      await onRunMatch(jobDescription);
    } catch (err: any) {
      setErrorMsg("Failed to execute matching matrix: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8" id="job-match-wrapper">
      
      {/* HEADER HERO */}
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white font-display flex items-center space-x-2.5">
          <Briefcase className="h-5.5 w-5.5 text-brand-indigo animate-pulse shrink-0" />
          <span>Compare Resume to Job Post</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 font-sans">
          Perform a targeted matching scan of your vocabulary keyword ratios directly against hiring metrics.
        </p>
      </div>

      {/* ENERGETIC GRID FLOW */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* INPUT FORM CELL */}
        <div className="lg:col-span-5">
          <form onSubmit={handleMatchCall} className="glass-card rounded-2xl p-6 border border-white/10 space-y-5 shadow-lg">
            <div className="space-y-1">
              <h2 className="text-sm font-bold tracking-widest uppercase text-slate-400">Position requirements</h2>
              <span className="text-[10px] text-slate-500 font-mono">Insert the target JD or target spec parameters</span>
            </div>

            <div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description details in full here..."
                required
                className="w-full glass-input rounded-xl p-4 text-xs h-80 font-sans leading-relaxed resize-none"
                id="match-input-box"
              />
            </div>

            {errorMsg && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 min-h-[48px] rounded-xl bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-cyan hover:brightness-110 font-bold text-xs sm:text-sm text-white shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              id="match-submit-trigger"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                  <span>Matching alignment indexes...</span>
                </>
              ) : (
                <>
                  <span>Execute Matching scan</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* METRICS & ANALYSIS COMPARISON SCREEN */}
        <div className="lg:col-span-7 space-y-6">
          {latestMatchResult ? (
            <div className="space-y-6" id="match-results-preview-area">
              
              {/* PRIMARY MATCH PERCENTAGE AND COMPATIBILITY RATINGS */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="glass-panel border-white/10 rounded-2xl p-6.5 text-center flex flex-col items-center justify-center space-y-2">
                  <span className="text-[10px] tracking-widest uppercase font-mono text-slate-500 block">Match Score percentage</span>
                  <div className="text-4xl font-extrabold text-brand-cyan font-display">
                    {latestMatchResult.match_percentage}%
                  </div>
                  <span className="text-[11px] text-slate-350">
                    {latestMatchResult.match_percentage >= 80 ? "🎯 Exceptional Alignment" : "⚠️ Keyword Gaps Detected"}
                  </span>
                </div>

                <div className="glass-panel border-white/10 rounded-2xl p-6.5 text-center flex flex-col items-center justify-center space-y-2">
                  <span className="text-[10px] tracking-widest uppercase font-mono text-slate-500 block">Recruiter readiness</span>
                  <div className="text-4xl font-extrabold text-brand-purple font-display">
                    {latestMatchResult.recruiter_readiness_score}%
                  </div>
                  <span className="text-[11px] text-slate-350">
                    Interview probability scale
                  </span>
                </div>
              </div>

              {/* RECRUITER INSIGHT */}
              <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-2.5">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-brand-indigo" />
                  <span>Executive Recruiter Outlook Feedback</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans font-medium">
                  &quot;{latestMatchResult.recruiter_feedback}&quot;
                </p>
              </div>

              {/* RECOMMENDED KEYWORD ENRICHMENTS */}
              <div className="glass-panel border-white/10 bg-white/2 rounded-2xl p-5 space-y-3.5">
                <span className="text-xs uppercase font-mono tracking-widest font-bold text-slate-400">Target missing domain skills</span>
                <div className="flex flex-wrap gap-2">
                  {latestMatchResult.missing_skills && latestMatchResult.missing_skills.length > 0 ? (
                    latestMatchResult.missing_skills.map((skill, sIndex) => (
                      <span key={sIndex} className="text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1 text-slate-300 font-medium">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">No urgent skills gaps! Exceptional coverage of technology tags.</span>
                  )}
                </div>
              </div>

              {/* IMPROVEMENTS GRID */}
              <div className="glass-card rounded-2xl p-5.5 border border-white/10 space-y-3">
                <span className="text-xs uppercase font-mono tracking-widest font-bold text-brand-cyan">Recommended content modifications</span>
                <div className="space-y-2">
                  {latestMatchResult.recommended_improvements && latestMatchResult.recommended_improvements.length > 0 ? (
                    latestMatchResult.recommended_improvements.map((imp, impIndex) => (
                      <div key={impIndex} className="p-3 bg-brand-bg rounded-xl border border-white/5 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-brand-cyan shrink-0 mt-0.5" />
                        <span>{imp}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No improvements flagged.</p>
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* EMPTY VIEW */
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl bg-slate-950/20 text-slate-500 text-center px-6">
              <Layers className="h-10 w-10 text-slate-600 mb-3 animate-pulse" />
              <h3 className="text-sm font-bold text-white font-display mb-1">Await Matching Execution</h3>
              <p className="text-xs max-w-sm">
                Paste the target company requirements description in the positioning box on the left, then click analyze matching results.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
