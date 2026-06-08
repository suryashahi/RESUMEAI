import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, FileText, CheckCircle2, TrendingUp, AlertCircle, Sparkles, 
  ChevronRight, Calendar, ArrowUpRight, ShieldCheck, HelpCircle, RefreshCw 
} from "lucide-react";
import { HistoricalAnalysis } from "../types";

interface DashboardHomeProps {
  onAnalyzeFile: (fileBase64: string, name: string, type: string, jobDesc: string) => void;
  recentAnalyses: HistoricalAnalysis[];
  onSelectHistory: (analysis: HistoricalAnalysis) => void;
  loading: boolean;
}

export default function DashboardHome({
  onAnalyzeFile,
  recentAnalyses,
  onSelectHistory,
  loading,
}: DashboardHomeProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescriptionStr, setJobDescriptionStr] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorText, setErrorText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setErrorText("");
    const validTypes = [
      "application/pdf", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
      "text/plain"
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".docx")) {
      setErrorText("Invalid file type. Please upload a verified PDF, DOCX or TXT format.");
      return;
    }
    
    // limit size to 4mb to avoid excessive server memory bounds
    if (file.size > 4 * 1024 * 1024) {
      setErrorText("File size exceeds 4MB. Please upload a smaller document.");
      return;
    }

    setSelectedFile(file);
    
    // Simulate upload progress UI
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 120);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerSubmit = () => {
    if (!selectedFile) return;

    // Read file to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64Str = (reader.result as string).split(",")[1];
      onAnalyzeFile(base64Str, selectedFile.name, selectedFile.type || "application/octet-stream", jobDescriptionStr);
    };
    reader.onerror = () => {
      setErrorText("Failed to read the file structure correctly. Please retry.");
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleResetFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setErrorText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Compute stats or general items
  const totalReviewsCount = recentAnalyses.length;
  const averageScore = totalReviewsCount > 0 
    ? Math.round(recentAnalyses.reduce((acc, curr) => acc + curr.overallScore, 0) / totalReviewsCount)
    : 0;
  
  // Custom SVG line coordinate generator for trends chart representing premium feel
  const generateTrendPath = () => {
    if (recentAnalyses.length < 2) return "M 30,100 L 270,100";
    const reversedHistory = [...recentAnalyses].reverse();
    const width = 340;
    const height = 110;
    const paddingX = 30;
    const paddingY = 20;
    
    const points = reversedHistory.map((item, i) => {
      const x = paddingX + (i / (reversedHistory.length - 1)) * (width - paddingX * 2);
      // invert y (100 overallScore is higher up i.e. closer to 0 paddingY)
      const y = height - paddingY - ((item.overallScore - 50) / 50) * (height - paddingY * 2);
      return { x, y };
    });

    return points.reduce((path, pt, idx) => {
      return idx === 0 ? `M ${pt.x},${pt.y}` : `${path} L ${pt.x},${pt.y}`;
    }, "");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10" id="dash-home-container">
      
      {/* WELCOME HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6" id="dash-welcome">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-brand-indigo font-bold bg-brand-indigo/10 px-2.5 py-1 rounded-md">
            Interactive SaaS Workspace
          </span>
          <h1 className="mt-2 text-2xl md:text-4xl font-extrabold tracking-tight text-white font-display">
            Welcome to ResumeAI Workspace
          </h1>
          <p className="mt-1 text-slate-400 text-sm font-sans">
            Instantly parse standard resume files, evaluate keywords densities, and check compatibility scores against target industry job descriptions.
          </p>
        </div>

        {/* Limit tracker indicator */}
        <div className="glass-panel rounded-xl p-3.5 px-4.5 border border-white/5 flex items-center space-x-3 shrink-0 shadow-lg select-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">System status</span>
            <span className="text-sm font-bold text-emerald-400 leading-none">Fully Unlocked & Active</span>
          </div>
        </div>
      </div>

      {/* CORE ACTION SUBMISSION GRID */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* FILE UPLOAD CARD */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card rounded-2xl p-6.5 border border-white/10 shadow-xl relative" id="upload-panel">
            <h2 className="text-lg font-bold font-display text-white mb-4 flex items-center space-x-2">
              <Upload className="h-4.5 w-4.5 text-brand-cyan" />
              <span>Submit New Scan</span>
            </h2>

            {/* DRAG DROPPING ZONE */}
            {!selectedFile ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 sm:p-8.5 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? "border-brand-indigo bg-brand-indigo/5 scale-[0.99]" 
                    : "border-white/15 bg-white/1 hover:border-white/20 hover:bg-white/3"
                }`}
                id="dropzone-area"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                />
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-inner mb-3">
                  <Upload className="h-5 w-5 text-slate-400" />
                </div>
                <h3 className="text-sm font-bold text-white font-display">Drag and drop your file here</h3>
                <p className="text-xs text-slate-500 mt-1.5">PDF, DOCX, or pure TXT formats (Max size: 4MB)</p>
                <span className="inline-block mt-4 rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-mono text-brand-cyan hover:bg-white/8">
                  Browse Workspace Files
                </span>
              </div>
            ) : (
              // FILE PREVIEW ATTACHED STATE
              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-5 space-y-4" id="upload-preview-area">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-indigo/20 text-brand-indigo">
                      <FileText className="h-5.5 w-5.5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs">{selectedFile.name}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Completed
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleResetFile}
                    className="text-xs text-slate-500 hover:text-red-400 hover:underline transition-all"
                  >
                    Clear File
                  </button>
                </div>

                {/* Progress bar indication */}
                {uploadProgress < 100 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Preparing document arrays...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-cyan" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error notifications */}
            {errorText && (
              <div className="mt-4 flex items-center space-x-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{errorText}</span>
              </div>
            )}

            {/* OPTIONAL ROLE MATCH INPUT FIELD */}
            <div className="mt-5 space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Target Job Post / Requirements <span className="text-slate-600">(Optional Alignment Check)</span>
                </label>
                <span className="text-[10px] font-mono text-slate-500">Compare keywords automatically</span>
              </div>
              <textarea
                value={jobDescriptionStr}
                onChange={(e) => setJobDescriptionStr(e.target.value)}
                placeholder="Paste the target job description or core technical keywords (e.g. React, NextJS App Router, AWS S3, TypeScript, schema validation) to execute matching review..."
                className="w-full glass-input rounded-xl p-3.5 text-xs h-28 resize-none font-sans leading-relaxed"
                id="upload-job-desc-box"
              />
            </div>

            {/* SUBMIT BUTTON TRIGGER FOR RESUME ANALYZING */}
            <button
              onClick={triggerSubmit}
              disabled={loading || !selectedFile || uploadProgress < 100}
              className="mt-6 w-full py-3.5 px-4 min-h-[48px] rounded-xl bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-cyan hover:brightness-110 font-bold text-sm text-white shadow-lg shadow-brand-indigo/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              id="analyze-resume-submit-btn"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                  <span>AI Parsing & Scoring Stack...</span>
                </>
              ) : (
                <>
                  <span>Begin AI Scan Analysis</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* SIDEBAR CHARTS AND HIGHLIGHTS */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* ATS SCORE TRENDS GRAPH */}
          <div className="glass-card rounded-2xl p-6 border border-white/10 shadow-xl" id="trends-block">
            <h2 className="text-sm font-bold font-display uppercase tracking-widest text-slate-400 mb-3 flex items-center justify-between">
              <span>ATS Score Trajectory</span>
              <TrendingUp className="h-4 w-4 text-brand-indigo" />
            </h2>

            {recentAnalyses.length > 0 ? (
              <div className="space-y-4">
                <div className="relative h-[120px] bg-slate-950/40 rounded-xl border border-white/5 flex items-end p-2.5 overflow-hidden">
                  {/* Embedded Custom SVG trendline graph */}
                  <svg className="absolute inset-0 h-full w-full">
                    {/* Gridlines */}
                    <line x1="0" y1="20" x2="100%" y2="20" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                    <line x1="0" y1="55" x2="100%" y2="55" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                    <line x1="0" y1="90" x2="100%" y2="90" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                    
                    {/* SVG Trendline Path */}
                    <path
                      d={generateTrendPath()}
                      fill="none"
                      stroke="url(#indigoCyanGrad)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Gradient definers */}
                    <defs>
                      <linearGradient id="indigoCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366F1" />
                        <stop offset="50%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#06B6D4" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Graph scale tags */}
                  <div className="absolute top-2 left-2 text-[8px] font-mono text-slate-600">100% Opt</div>
                  <div className="absolute bottom-2 left-2 text-[8px] font-mono text-slate-600">50% Pass</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
                  <div className="bg-white/3 rounded-lg p-2 border border-white/5">
                    <span className="text-[10px] text-slate-505 font-mono block">Submissions</span>
                    <span className="text-xl font-bold font-display text-white">{totalReviewsCount}</span>
                  </div>
                  <div className="bg-white/3 rounded-lg p-2 border border-white/5">
                    <span className="text-[10px] text-slate-505 font-mono block">Mean Score</span>
                    <span className="text-xl font-bold font-display text-brand-cyan">{averageScore}%</span>
                  </div>
                  <div className="bg-white/3 rounded-lg p-2 border border-white/5">
                    <span className="text-[10px] text-slate-505 font-mono block">Accuracy</span>
                    <span className="text-xl font-bold font-display text-brand-purple">98.4%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[170px] flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl bg-slate-950/20 text-slate-500">
                <TrendingUp className="h-8 w-8 text-slate-600 mb-2 animate-pulse" />
                <span className="text-xs text-center font-sans px-4">Upload and scan dynamic files to generate real-time visual index graphics.</span>
              </div>
            )}
          </div>

          {/* AI SAAS INSIGHTS */}
          <div className="glass-panel rounded-2xl p-6.5 border border-white/15 relative overflow-hidden" id="insights-panel">
            <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase mb-3 flex items-center space-x-1.5">
              <Sparkles className="h-4 w-4 text-brand-cyan" />
              <span>Engine Updates & Heuristics</span>
            </h3>
            <div className="space-y-3.5 text-xs text-slate-350">
              <div className="p-3 bg-white/3 rounded-xl border border-white/3 flex items-start gap-2.5">
                <div className="h-2 w-2 rounded-full bg-brand-cyan shrink-0 mt-1.5 animate-ping"></div>
                <div>
                  <h4 className="font-bold text-white mb-0.5">Custom Job Weights updated</h4>
                  <p className="text-slate-400">The 2026 applicant tracking standard checks heavily for container security and system modularity protocols.</p>
                </div>
              </div>
              <div className="p-3 bg-white/3 rounded-xl border border-white/3 flex items-start gap-2.5">
                <div className="h-2 w-2 rounded-full bg-brand-purple shrink-0 mt-1.5"></div>
                <div>
                  <h4 className="font-bold text-white mb-0.5">XYZ Formula Generator Active</h4>
                  <p className="text-slate-400">Our parser recommends drafting action highlights strictly aligned to the model: &quot;Accomplished X, measured by Y, by doing Z.&quot;</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* HISTORIC SUBMISSIONS ROW */}
      <div className="glass-panel rounded-2xl p-6 border border-white/5" id="history-box">
        <h2 className="text-base font-bold font-display text-white mb-4">Historical Scanning Archives</h2>

        {recentAnalyses.length > 0 ? (
          <div className="space-y-3.5">
            {recentAnalyses.map((history) => (
              <div
                key={history.id}
                onClick={() => onSelectHistory(history)}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-white/5 bg-white/2 hover:bg-white/5 rounded-xl p-4 cursor-pointer transition-all duration-200"
                id={`history-${history.id}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="h-9 w-9 rounded-lg bg-brand-indigo/15 flex items-center justify-center text-brand-indigo text-xs font-bold font-mono shrink-0">
                    {history.overallScore}%
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-md">{history.resumeName}</h4>
                    <span className="flex items-center text-[10px] text-slate-400 font-mono mt-0.5">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(history.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-3.5 w-full sm:w-auto pt-2.5 sm:pt-0 border-t border-white/5 sm:border-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-500 font-mono block">ATS Weight</span>
                    <span className="text-xs font-bold text-brand-cyan block">{history.atsScore}% Score</span>
                  </div>
                  <ChevronRight className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 border border-dashed border-white/5 rounded-xl text-center text-slate-550 flex flex-col items-center justify-center">
            <FileText className="h-10 w-10 text-slate-600 mb-2" />
            <p className="text-xs font-medium">No resume analyses listed yet.</p>
            <p className="text-[11px] text-slate-600 mt-1">Upload a PDF or Word file above to execute your first report card.</p>
          </div>
        )}
      </div>

    </div>
  );
}
