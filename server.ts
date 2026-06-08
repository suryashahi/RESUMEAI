import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createRequire } from "module";
const requireShared = createRequire(import.meta.url);
const pdfParse = requireShared("pdf-parse");
const mammoth = requireShared("mammoth");
import dotenv from "dotenv";
import { 
  analyzeResume, 
  matchJobDescription, 
  generateCareerRoadmap, 
  generateCoverLetter 
} from "./src/lib/ai-router";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Lazy initializer for Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined in environment variables. Falling back to simulated AI response.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// PDF/DOCX text extraction helper
async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf" || mimeType.includes("pdf")) {
    try {
      const data = await pdfParse(buffer);
      return data.text || "";
    } catch (err: any) {
      console.error("Error parsing PDF via pdf-parse, falling back:", err);
      // Fallback regex to capture printable ASCII from buffer
      return buffer.toString("utf-8").replace(/[^\x20-\x7E\r\n\t]/g, " ");
    }
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
    mimeType.includes("officedocument") ||
    mimeType.includes("msword")
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    } catch (err: any) {
      console.error("Error parsing Word DOCX document:", err);
      return buffer.toString("utf-8");
    }
  } else {
    // Treat as raw text
    return buffer.toString("utf-8");
  }
}

// Generate fallback metadata for simulated reviews if Gemini API key is not present
function generateFallbackReview(resumeText: string) {
  const words = resumeText.split(/\s+/).length;
  const hasReact = /react/i.test(resumeText);
  const hasNode = /node/i.test(resumeText);
  const hasPython = /python/i.test(resumeText);
  const hasAws = /aws|cloud/i.test(resumeText);

  const missing = [];
  if (!hasReact) missing.push("React.js & modern frontend hooks");
  if (!hasNode) missing.push("Node.js microservices & Express routing");
  if (!hasPython) missing.push("Python data models");
  if (!hasAws) missing.push("AWS cloud services (lambda, ec2, s3)");
  if (missing.length === 0) {
    missing.push("Kubernetes orchestration", "Docker containers optimization", "GraphQL endpoints styling");
  }

  const score = Math.round(70 + Math.random() * 25);
  const ats = Math.round(68 + Math.random() * 27);
  const skills = Math.round(72 + Math.random() * 23);
  const readability = Math.round(75 + Math.random() * 22);
  const readiness = Math.round(70 + Math.random() * 25);

  return {
    overall_score: score,
    ats_score: ats,
    skills_score: skills,
    readability_score: readability,
    recruiter_readiness_score: readiness,
    strengths: [
      "Excellent overall presentation and structural flow",
      hasReact ? "Strong command of dynamic client state frameworks" : "Solid technical vocabulary structure",
      "Excellently formatted professional achievements with action verbs",
      "Broad industry relevance with clear educational trajectory"
    ],
    weaknesses: [
      "Missing quantitative targets (e.g. percentages increases, direct revenue achievements)",
      "Lack of cloud orchestration framework keywords in main project bullets",
      "Slightly verbose description of legacy junior team achievements"
    ],
    missing_skills: missing,
    keyword_optimization: [
      { keyword: "Kubernetes", frequency: 0, status: "Missing", recommendation: "Incorporate Kubernetes or Docker descriptors in deployment summaries." },
      { keyword: "TypeScript", frequency: hasReact ? 3 : 0, status: hasReact ? "Good" : "Missing", recommendation: "Demonstrate type safety awareness." },
      { keyword: "System Design", frequency: 1, status: "Optimize", recommendation: "Discuss system architectural patterns in senior project lead points." },
      { keyword: "CI/CD Pipeline", frequency: 0, status: "Missing", recommendation: "Mention GitHub Actions or Jenkins workflows." }
    ],
    grammar_issues: [
      { original: "Responsible for managing of three client deployment builds", correction: "Managed three client deployment builds", explanation: "Active strong action verb replaces wordy passive construction." }
    ],
    recommendations: [
      "Rewrite role bullet points to reflect quantified action: 'increased query response speed by 40% via key indexing' instead of 'responsible for indexing'.",
      "Insert a dedicated 'Technical Summary' grid of critical subheadings to boost indexability by standard modern resume search queries.",
      "Consolidate education details to single-line declarations to reclaim valuable physical space for top achievements."
    ]
  };
}

function generateFallbackJobMatch(resumeText: string, jobDesc: string) {
  const score = Math.round(65 + Math.random() * 30);
  const readiness = Math.round(70 + Math.random() * 25);
  return {
    match_percentage: score,
    missing_skills: [
      "System Optimization Protocols",
      "Containerization orchestration (Docker/K8s)",
      "Unit testing pipelines (Jest/Cypress)"
    ],
    recommended_improvements: [
      "Incorporate key bullet terms from the job post directly, specifically matching exact technical skill names.",
      "Emphasize production scale accomplishments in alignment with the job description's focus on high-throughput environments.",
      "Rearrange skills grid to feature target job primary technologies at the very top."
    ],
    recruiter_readiness_score: readiness,
    recruiter_feedback: `The resume aligns moderately well (${score}%) with the requirement. There is robust core base experience, but the candidate misses critical vocabulary keywords highlighting optimization metrics and container setup. Adjusting these will elevate ATS rankings considerably.`
  };
}

function generateFallbackCoverLetter(resumeText: string, jobDesc: string) {
  // Simple heuristic parsing for names
  const firstLines = resumeText.slice(0, 150);
  const words = firstLines.match(/[A-Z][a-z]+/g) || ["Jane", "Doe"];
  const candidateName = words.slice(0, 2).join(" ");
  
  const jobWords = jobDesc.match(/[A-Z][a-zA-Z]+/g) || ["Technical", "Company"];
  const companyName = jobWords.find(w => w !== "Company" && w.length > 3) || "Innovate Corp";
  const roleName = jobDesc.split("\n")[0]?.slice(0, 40) || "Software Engineer";

  return {
    subject: `Application for ${roleName} - ${candidateName}`,
    salutation: `Dear Hiring Team at ${companyName},`,
    body: [
      `I am writing to express my enthusiastic interest in the ${roleName} role. Upon analyzing your job description, I immediately recognized a powerful synergy between your team's tactical vision and my technical background in engineering high-quality web infrastructures.`,
      `With extensive hands-on experience designing robust application frameworks and optimizing database index responses, I have consistently driven digital transformations. My background is rooted in launching reliable systems that scale gracefully, making me excited to contribute to your core platforms immediately.`,
      `What particularly draws me to your company is your unrelenting pursuit of technical excellence. I thrive in responsive, developer-centric spaces and look forward to contributing high-velocity code and robust operational discipline to your current projects.`,
      `Thank you for your time, consideration, and dedication to building fantastic developer experiences. I welcome the opportunity to discuss how my skill set, architectural philosophy, and background align with your growth objectives.`
    ],
    sign_off: `Sincerely,\n\n${candidateName}`
  };
}

function generateFallbackResumeBuilder(experience: string, skills: string, role: string) {
  return {
    summary: `Results-focused professional with deep development background aiming to transition successfully into a key ${role || "Senior Cloud Consultant"} capacity. Expert at modern engineering methodologies, systems architecture, and product-focused execution.`,
    experience: [
      {
        company: "Apex Tech Systems",
        role: role || "Lead Application Engineer",
        duration: "2023 - Present",
        bullet_points: [
          `Pioneered structural rewrite of core dashboards, accelerating performance by 35% and upgrading accessibility across all interfaces.`,
          `Led cross-functional unit of five developers to construct responsive features for over 120,000 active platform accounts.`,
          `Introduced strict automated testing suites, cutting major regression issues by 60% inside first three months of onboarding.`
        ]
      },
      {
        company: "Stellar Core Software",
        role: "Software Developer",
        duration: "2021 - 2023",
        bullet_points: [
          "Developed high-throughput API microservices handling upwards of 12M monthly transactions cleanly.",
          "Refactored legacy database models to cut complex multi-join queries from 800ms down to less than 95ms.",
          "Partnered with product managers to launch key interface elements resulting in a 14% increase in conversion."
        ]
      }
    ],
    skills: skills ? skills.split(",").map(s => s.trim()) : ["React", "TypeScript", "Node.js", "System Design", "AWS", "CI/CD"],
    education: [
      {
        institution: "State University of Technology",
        degree: "B.S. in Computer Science & System Engineering",
        year: "2021"
      }
    ]
  };
}

// HEALTH API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

// ANALYZE RESUME ENDPOINT
app.post("/api/analyze-resume", async (req, res) => {
  try {
    const { fileData, fileName, fileType, jobDescription } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: "No file data provided." });
    }

    const buffer = Buffer.from(fileData, "base64");
    const resumeText = await extractTextFromBuffer(buffer, fileType || "");

    const hasKeys = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
    if (!hasKeys) {
      // Return simulated but premium analysis
      const simulatedReview = generateFallbackReview(resumeText);
      return res.json({
        success: true,
        method: "simulated-mode",
        analysis: simulatedReview,
        resumeText
      });
    }

    try {
      const result = await analyzeResume(resumeText, jobDescription);
      return res.json({
        success: true,
        method: result.provider,
        analysis: result.data,
        resumeText
      });
    } catch (routeError: any) {
      console.error("[SERVER] AI Fallback Router failed on analyzeResume:", routeError);
      return res.status(500).json({
        error: "All AI providers in fallback system failed: " + routeError.message
      });
    }
  } catch (error: any) {
    console.error("Error in analyze-resume:", error);
    res.status(500).json({ error: "Internal server error: " + error.message });
  }
});

// JOB MATCH ENDPOINT
app.post("/api/job-match", async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: "Missing resume text or job description." });
    }

    const hasKeys = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
    if (!hasKeys) {
      const fallback = generateFallbackJobMatch(resumeText, jobDescription);
      return res.json({ success: true, method: "simulated-mode", analysis: fallback });
    }

    try {
      const result = await matchJobDescription(resumeText, jobDescription);
      return res.json({ success: true, method: result.provider, analysis: result.data });
    } catch (routeError: any) {
      console.error("[SERVER] AI Fallback Router failed on matchJobDescription:", routeError);
      return res.status(500).json({
        error: "All AI providers in fallback system failed: " + routeError.message
      });
    }
  } catch (error: any) {
    console.error("Error in job-match API:", error);
    res.status(500).json({ error: error.message });
  }
});

// GENERATE COVER LETTER ENDPOINT
app.post("/api/generate-cover-letter", async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: "Resume details and Job Description are required for custom cover letters." });
    }

    const hasKeys = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
    if (!hasKeys) {
      const fallback = generateFallbackCoverLetter(resumeText, jobDescription);
      return res.json({ success: true, method: "simulated-mode", coverLetter: fallback });
    }

    try {
      const result = await generateCoverLetter(resumeText, jobDescription);
      return res.json({ success: true, method: result.provider, coverLetter: result.data });
    } catch (routeError: any) {
      console.error("[SERVER] AI Fallback Router failed on generateCoverLetter:", routeError);
      return res.status(500).json({
        error: "All AI providers in fallback system failed: " + routeError.message
      });
    }
  } catch (error: any) {
    console.error("Error in cover-letter API:", error);
    res.status(500).json({ error: error.message });
  }
});

// GENERATE RESUME STRUC ENDPOINT (RESUME BUILDER)
app.post("/api/generate-resume-builder", async (req, res) => {
  try {
    const { experience, skills, role } = req.body;

    const client = getGeminiClient();
    if (!client) {
      const fallback = generateFallbackResumeBuilder(experience, skills, role);
      return res.json({ success: true, method: "simulation", resume: fallback });
    }

    const prompt = `You are an expert resume architect. Generate professional bullet points and structured summaries using high-impact metric verbs.
Experience background:
${experience || "Junior dev"}
Core developer skills listed:
${skills || "React, JS"}
Target job role or description:
${role || "Technical Lead"}

Respond in this exact JSON schema:
{
  "summary": "string",
  "experience": [
    { "company": "string", "role": "string", "duration": "string", "bullet_points": ["string"] }
  ],
  "skills": ["string"],
  "education": [
    { "institution": "string", "degree": "string", "year": "string" }
  ]
}`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.text || "";
    try {
      const parsed = JSON.parse(jsonText.trim());
      return res.json({ success: true, method: "gemini", resume: parsed });
    } catch (e) {
      return res.json({
        success: true,
        method: "fallback",
        resume: generateFallbackResumeBuilder(experience, skills, role)
      });
    }
  } catch (error: any) {
    console.error("Error in resume-builder API:", error);
    res.status(500).json({ error: error.message });
  }
});

function generateFallbackRoadmap(skills: string, role: string) {
  return {
    timeline: {
      plan_30_day: [
        `Deep dive into native principles of ${role || "Target Role"} with a strong focus on structural design principles and standard systems patterns.`,
        "Construct robust sandbox projects and validate design principles via local tests.",
        "Assess current state benchmarks, document target outcomes, and align with global job standards."
      ],
      plan_90_day: [
        `Develop three complex web services featuring integrations of ${skills || "Current skills"} and targeted frameworks.`,
        "Enforce strict automated integrations, continuous delivery pipelines, and comprehensive unit test workflows.",
        "Build modern full-featured applications using state containers, optimized query caching, and dynamic schemas."
      ],
      plan_180_day: [
        `Acquire professional cloud architect credentials or complete certified workspace integrations.`,
        "Publish dual high-performance open-source tools with premium interfaces and active public documentation.",
        "Consult with startup teams or guide active peer developer communities in the target ecosystem."
      ]
    },
    recommendations: {
      projects: [
        { name: `${role || "Target"} Performance Suite`, description: `Compile customized metric telemetry, scalable backend pipelines, and modern glassmorphic dashboards using ${skills || "applicable APIs"}.` },
        { name: "Global Edge Sandbox", description: "Design a high-availability client-facing service with multi-region CDN delivery, and cached secure edge database instances." }
      ],
      courses: [
        { name: `Advanced masterclass in ${role || "Target Role"} Implementations`, platform: "Coursera / Udemy" },
        { name: "System Scalability, Cloud Architecting, and Automation Pipelines", platform: "edX / Pluralsight" }
      ],
      resources: [
        "Official specifications and design guide conventions",
        "W3C standard architecture manifests & security reviews",
        "Modern API systems deployment manuals and caching practices"
      ]
    }
  };
}

// GENERATE CAREER ROADMAP ENDPOINT
app.post("/api/generate-roadmap", async (req, res) => {
  try {
    const { skills, role } = req.body;

    const hasKeys = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
    if (!hasKeys) {
      const fallback = generateFallbackRoadmap(skills, role);
      return res.json({ success: true, method: "simulated-mode", roadmap: fallback });
    }

    try {
      const result = await generateCareerRoadmap(skills, role);
      return res.json({ success: true, method: result.provider, roadmap: result.data });
    } catch (routeError: any) {
      console.error("[SERVER] AI Fallback Router failed on generateCareerRoadmap:", routeError);
      return res.status(500).json({
        error: "All AI providers in fallback system failed: " + routeError.message
      });
    }
  } catch (error: any) {
    console.error("Error in generate-roadmap API:", error);
    res.status(500).json({ error: error.message });
  }
});

// STATIC VITE SETUP
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
