import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Sparkles, FileText, Check, Copy, RefreshCw, AlertCircle, Printer, CheckCircle2 
} from "lucide-react";
import { CoverLetterData } from "../types";

interface CoverLetterToolProps {
  resumeText: string;
  onGenerateCoverLetter: (jobDesc: string) => Promise<CoverLetterData>;
}

export default function CoverLetterTool({
  resumeText,
  onGenerateCoverLetter,
}: CoverLetterToolProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [copystate, setCopystate] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [coverLetter, setCoverLetter] = useState<CoverLetterData | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText) {
      setErrorMsg("Please upload your base resume on the Dashboard before generating personalized letters.");
      return;
    }
    if (!jobDescription || jobDescription.trim().length < 50) {
      setErrorMsg("Please provide detailed positioning parameters (minimum 50 characters).");
      return;
    }

    setErrorMsg("");
    setLoading(true);
    try {
      const generated = await onGenerateCoverLetter(jobDescription);
      setCoverLetter(generated);
    } catch (err: any) {
      setErrorMsg("Failed to synthesize cover letter details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!coverLetter) return;
    const bodyText = coverLetter.body.join("\n\n");
    const fullText = `${coverLetter.subject}\n\n${coverLetter.salutation}\n\n${bodyText}\n\n${coverLetter.sign_off}`;
    
    navigator.clipboard.writeText(fullText);
    setCopystate(true);
    setTimeout(() => setCopystate(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8" id="cover-letter-wrapper">
      
      {/* TITLE INTRO */}
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white font-display flex items-center space-x-2.5">
          <Sparkles className="h-5.5 w-5.5 text-brand-indigo shrink-0" />
          <span>Generative AI Cover Letters</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 font-sans">
          Generate high-converting personalized letters aligning your candidate strengths directly with corporate descriptions.
        </p>
      </div>

      {/* CORE SPLIT GRID VIEW */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* FORM CONFIG DETAILS */}
        <div className="lg:col-span-5">
          <form onSubmit={handleGenerate} className="glass-card rounded-2xl p-6 border border-white/10 space-y-5 shadow-lg">
            <div className="space-y-1">
              <h3 className="text-sm font-bold tracking-widest uppercase text-slate-400">Position specs</h3>
              <span className="text-[10px] text-slate-500 font-mono">Input the corporate description</span>
            </div>

            <div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job position details in full here or describe the company goals..."
                required
                className="w-full glass-input rounded-xl p-4 text-xs h-72 font-sans leading-relaxed resize-none"
                id="letter-job-desc"
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
              id="letter-submit"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                  <span>Synthesizing structural pitch letters...</span>
                </>
              ) : (
                <>
                  <span>Synthesize Cover Letter</span>
                  <Sparkles className="h-4 w-4 text-white" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* OUTPUT SHEETS VIEW DISPLAYING GENERATED PAPER CARDS */}
        <div className="lg:col-span-7">
          {coverLetter ? (
            <div className="space-y-4" id="letter-document-wrapper">
              
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/3 border border-white/10 p-3 rounded-xl select-none">
                <span className="text-xs text-brand-cyan font-mono font-bold flex items-center gap-1.5 justify-center sm:justify-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse"></span>
                  Draft output generated
                </span>
                <div className="flex space-x-2 w-full sm:w-auto">
                  <button
                    onClick={handleCopy}
                    className="flex-1 sm:flex-none p-2 sm:p-1 px-3 min-h-[40px] sm:min-h-0 border border-white/10 bg-white/3 hover:bg-white/8 rounded-lg text-xs font-semibold text-white transition-all flex items-center justify-center space-x-1 cursor-pointer"
                    id="copy-letter"
                  >
                    {copystate ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copystate ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 sm:flex-none p-2 sm:p-1.5 px-3 min-h-[40px] sm:min-h-0 rounded-lg bg-brand-indigo text-xs font-bold text-white flex items-center justify-center space-x-1 cursor-pointer"
                    id="print-letter"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Letter</span>
                  </button>
                </div>
              </div>

              {/* SHEET CARD CONTAINER */}
              <div className="rounded-2xl shadow-2xl p-8 border bg-slate-50 border-slate-200 text-slate-800 font-sans tracking-tight leading-relaxed text-sm shadow-inner" id="visual-letter-doc">
                <div className="text-slate-505 text-xs font-semibold mb-6 border-b pb-3 border-slate-300">
                  <span className="font-bold text-slate-800">SUBJECT:</span> &quot;{coverLetter.subject}&quot;
                </div>

                <div className="space-y-4 text-slate-700">
                  <p className="font-semibold text-slate-800">{coverLetter.salutation}</p>
                  {coverLetter.body.map((para, pIdx) => (
                    <p key={pIdx} className="text-justify leading-relaxed text-xs sm:text-sm">
                      {para}
                    </p>
                  ))}
                  <p className="pt-4 font-semibold text-slate-800 whitespace-pre-line">
                    {coverLetter.sign_off}
                  </p>
                </div>
              </div>

            </div>
          ) : (
            /* EMPTY VIEW */
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl bg-slate-950/20 text-slate-500 text-center px-6">
              <FileText className="h-10 w-10 text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-white font-display mb-1">Generated Draft Document</h3>
              <p className="text-xs max-w-sm">
                Provide detailed targeting company specifications on the configurator form, then click synthesize cover letter.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
