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
import {
  extractTextFromBuffer,
  generateFallbackReview,
  generateFallbackJobMatch,
  generateFallbackCoverLetter,
  generateFallbackResumeBuilder,
  generateFallbackRoadmap
} from "./src/lib/backend-helpers";

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
