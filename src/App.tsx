import React, { useState, useEffect } from "react";
import { HistoricalAnalysis, AnalysisData, JobMatchData, CoverLetterData, ResumeBuilderData, CareerRoadmapData } from "./types";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import DashboardHome from "./components/DashboardHome";
import AnalysisWorkspace from "./components/AnalysisWorkspace";
import JobMatchTool from "./components/JobMatchTool";
import ResumeBuilderTool from "./components/ResumeBuilderTool";
import CoverLetterTool from "./components/CoverLetterTool";
import CareerRoadmapTool from "./components/CareerRoadmapTool";
import API_URL from "./config/api";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentView, setCurrentView] = useState<string>("landing");
  const [recentAnalyses, setRecentAnalyses] = useState<HistoricalAnalysis[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<HistoricalAnalysis | null>(null);
  const [latestMatchResult, setLatestMatchResult] = useState<JobMatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Auto-hide toast notifications helper
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg("");
    }, 4000);
  };

  // Sync state with localStorage on startup
  useEffect(() => {
    const savedHistory = localStorage.getItem("resai-recent-analyses");
    if (savedHistory) {
      try {
        setRecentAnalyses(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse local resume scan history.");
      }
    } else {
      // Pre-seed 1 high-quality static demo evaluation representing realistic user profile
      const seedHistory: HistoricalAnalysis[] = [
        {
          id: "seed-101",
          resumeName: "jane_doe_fullstack_lead.pdf",
          overallScore: 84,
          atsScore: 81,
          createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
          analysis: {
            overall_score: 84,
            ats_score: 81,
            strengths: [
              "Exceptional structural chronology with high visibility action headers.",
              "Broad vocabulary showing deep proficiency with core React and Node.js microservice protocols.",
              "Clear, measurable achievements with specific team indicators."
            ],
            weaknesses: [
              "Slightly passive language used in the junior executive summary sections.",
              "Missing crucial container optimization keywords (e.g. Docker, containerization scale details)."
            ],
            missing_skills: ["Kubernetes", "Docker Orchestration", "GraphQL Schema designs"],
            keyword_optimization: [
              { keyword: "React", frequency: 6, status: "Good", recommendation: "Optimal saturation. No modifications needed." },
              { keyword: "Kubernetes", frequency: 0, status: "Missing", recommendation: "Insert continuous orchestrations in AWS deployment summaries." },
              { keyword: "TypeScript", frequency: 3, status: "Good", recommendation: "Perfect type-safety reference weight." },
              { keyword: "Docker", frequency: 0, status: "Missing", recommendation: "Incorporate container build references inside key project bullets." }
            ],
            grammar_issues: [
              { original: "Responsible for guiding of three development members", correction: "Managed and guided three application engineers", explanation: "Active leadership indicators replace passive continuous verbs." }
            ],
            recommendations: [
              "Elevate project bullets with quantifiable outputs: e.g. 'reduced page latency by 28% via query adjustments'.",
              "Feature a robust Core Technical grids to boost automatic parsing match indexes."
            ]
          }
        }
      ];
      setRecentAnalyses(seedHistory);
      localStorage.setItem("resai-recent-analyses", JSON.stringify(seedHistory));
    }
  }, []);

  // MAIN RUN ENGINE SENDER
  const handleAnalyzeResumeFile = async (base64Data: string, fileName: string, fileType: string, jobDesc: string) => {
    setLoading(true);
    setErrorToast("");

    try {
      const response = await fetch(`${API_URL}/api/analyze-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileData: base64Data,
          fileName,
          fileType,
          jobDescription: jobDesc
        })
      });

      if (!response.ok) {
        throw new Error("Local server evaluation failed with state: " + response.status);
      }

      const result = await response.json();
      if (result.success && result.analysis) {
        // Incorporate to historical scans list
        const newAnalysisItem: HistoricalAnalysis = {
          id: `res-${Date.now()}`,
          resumeName: fileName,
          overallScore: result.analysis.overall_score || 80,
          atsScore: result.analysis.ats_score || 78,
          createdAt: new Date().toISOString(),
          analysis: result.analysis
        };

        const updatedHistory = [newAnalysisItem, ...recentAnalyses];
        setRecentAnalyses(updatedHistory);
        localStorage.setItem("resai-recent-analyses", JSON.stringify(updatedHistory));
        
        setActiveAnalysis(newAnalysisItem);
        setCurrentView("analysis");
        showToast("AI Scan successfully calculated! Opening scorecard review.");
      } else {
        throw new Error(result.error || "Failed to process analytical scorecard.");
      }
    } catch (e: any) {
      console.error("Scanning Error:", e);
      setErrorToast(e.message || "Failed to establish API session.");
    } finally {
      setLoading(false);
    }
  };

  // JOB MATCH SENDER
  const handleRunJobMatch = async (jobDescription: string) => {
    if (recentAnalyses.length === 0) {
      throw new Error("Please submit a primary resume scan before mapping jobs.");
    }
    const currentResumeText = recentAnalyses[0].resumeName; // fallback name representation
    
    const response = await fetch(`${API_URL}/api/job-match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText: `Current Document Title: ${currentResumeText}. Evaluated strengths: ${recentAnalyses[0].analysis.strengths.join(", ")}`,
        jobDescription
      })
    });

    if (!response.ok) {
      throw new Error("Job Match API responded with error.");
    }

    const result = await response.json();
    if (result.success && result.analysis) {
      setLatestMatchResult(result.analysis);
      showToast("Job Match metrics generated successfully!");
      return result.analysis;
    } else {
      throw new Error(result.error || "Analysis failed.");
    }
  };

  // GENERATE COVER LETTER SENDER
  const handleGenerateCoverLetter = async (jobDescription: string): Promise<CoverLetterData> => {
    if (recentAnalyses.length === 0) {
      throw new Error("Please submit a primary resume scan before generating custom letters.");
    }
    const baseText = `Resume summary highlights: ${recentAnalyses[0].analysis.strengths.join(", ")}`;

    const response = await fetch(`${API_URL}/api/generate-cover-letter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText: baseText,
        jobDescription
      })
    });

    if (!response.ok) {
      throw new Error("Cover Letter synthesis threw an error.");
    }

    const result = await response.json();
    if (result.success && result.coverLetter) {
      showToast("Personalized Cover Letter compiled!");
      return result.coverLetter;
    } else {
      throw new Error(result.error || "Failed cover letter.");
    }
  };

  // GENERATE RESUME STRUC SENDER
  const handleGenerateResumeBuilder = async (experience: string, skills: string, role: string): Promise<ResumeBuilderData> => {
    const response = await fetch(`${API_URL}/api/generate-resume-builder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ experience, skills, role })
    });

    if (!response.ok) {
      throw new Error("Resume builder API failed.");
    }

    const result = await response.json();
    if (result.success && result.resume) {
      showToast("Modern draft parsed successfully based on AI formulas.");
      return result.resume;
    } else {
      throw new Error(result.error || "Failed resume.");
    }
  };

  // GENERATE ROADMAP SENDER
  const handleGenerateRoadmap = async (skills: string, role: string): Promise<CareerRoadmapData> => {
    const response = await fetch(`${API_URL}/api/generate-roadmap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills, role })
    });

    if (!response.ok) {
      throw new Error("Career Roadmap API failed.");
    }

    const result = await response.json();
    if (result.success && result.roadmap) {
      showToast("Dynamic career timeline optimized successfully!");
      return result.roadmap;
    } else {
      throw new Error(result.error || "Failed roadmap.");
    }
  };

  const handleSelectHistory = (analysis: HistoricalAnalysis) => {
    setActiveAnalysis(analysis);
    setCurrentView("analysis");
  };

  const [errorToast, setErrorToast] = useState("");

  // Demo direct viewer trigger to showcase full system power
  const handleViewDemoTrigger = () => {
    if (recentAnalyses.length > 0) {
      setActiveAnalysis(recentAnalyses[0]);
      setCurrentView("analysis");
      showToast("Opening interactive demo report metrics.");
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col relative z-0 overflow-x-hidden" id="main-application-frame">
      
      {/* Background radial gradient blobs from Sleek Interface Theme */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-[#6366F1] opacity-20 blur-[100px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#06B6D4] opacity-30 blur-[100px] rounded-full pointer-events-none -z-10"></div>
      
      {/* Dynamic Toast Alerts Container Floating top-center */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-slate-900/90 border border-brand-indigo/30 p-3.5 text-xs text-white shadow-xl flex items-center space-x-2.5 backdrop-blur-md animate-bounce" id="floating-toast">
          <div className="h-2 w-2 rounded-full bg-brand-cyan animate-ping"></div>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Global Error Banner if API error occurs */}
      {errorToast && (
        <div className="bg-red-500/10 border-b border-red-500/20 p-2 text-center text-xs text-red-400 font-mono z-40 relative">
          ⚠️ <strong>Parser Warning:</strong> {errorToast}. Reverting session limits automatically.
          <button onClick={() => setErrorToast("")} className="ml-3 text-slate-400 underline hover:text-white">dismiss</button>
        </div>
      )}

      {/* NAVBAR HEADER */}
      <Navbar
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
      />

      {/* CORE VIEW ROUTER SWITCH PORTS */}
      <main className="flex-grow">
        {currentView === "landing" && (
          <LandingPage
            onViewChange={(view) => setCurrentView(view)}
            onViewDemo={handleViewDemoTrigger}
          />
        )}

        {currentView === "dashboard" && (
          <DashboardHome
            onAnalyzeFile={handleAnalyzeResumeFile}
            recentAnalyses={recentAnalyses}
            onSelectHistory={handleSelectHistory}
            loading={loading}
          />
        )}

        {currentView === "analysis" && activeAnalysis && (
          <AnalysisWorkspace
            analysis={activeAnalysis.analysis}
            fileName={activeAnalysis.resumeName}
            onBack={() => setCurrentView("dashboard")}
          />
        )}

        {currentView === "job-match" && (
          <JobMatchTool
            resumeText={recentAnalyses.length > 0 ? recentAnalyses[0].resumeName : ""}
            onRunMatch={handleRunJobMatch}
            latestMatchResult={latestMatchResult}
          />
        )}

        {currentView === "resume-builder" && (
          <ResumeBuilderTool
            onGenerate={handleGenerateResumeBuilder}
          />
        )}

        {currentView === "cover-letter" && (
          <CoverLetterTool
            resumeText={recentAnalyses.length > 0 ? recentAnalyses[0].resumeName : ""}
            onGenerateCoverLetter={handleGenerateCoverLetter}
          />
        )}

        {currentView === "career-roadmap" && (
          <CareerRoadmapTool
            onGenerateRoadmap={handleGenerateRoadmap}
          />
        )}
      </main>

    </div>
  );
}
