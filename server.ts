import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createRequire } from "module";

const requireShared = (() => {
  // 1. If in CommonJS environment, use native require immediately
  if (typeof require === "function") {
    return require;
  }
  // 2. If in ES Module, use createRequire with import.meta.url
  try {
    if (typeof import.meta !== "undefined" && import.meta.url) {
      return createRequire(import.meta.url);
    }
  } catch (err) {}
  // 3. Fallback: createRequire with __filename
  try {
    if (typeof __filename !== "undefined" && __filename) {
      return createRequire(__filename);
    }
  } catch (err) {}
  // 4. Safe Fallback: createRequire using absolute file path of standard configuration file in current container working directory
  try {
    const dummyFilePath = path.join(process.cwd(), "package.json");
    return createRequire(dummyFilePath);
  } catch (err) {}
  // 5. Ultimate fallback
  return (id: string) => {
    throw new Error(`Failed to initialize dynamic require loader for module: ${id}`);
  };
})();

const pdfParseRaw = requireShared("pdf-parse");
const mammothRaw = requireShared("mammoth");

// Safe resolve function handling potential default export or direct wrapper function
let pdfParse: any = null;
try {
  console.log("[SERVER-PDF-INIT] Raw pdf-parse loading metrics:", {
    typeof_raw: typeof pdfParseRaw,
    has_default: !!(pdfParseRaw && pdfParseRaw.default),
    keys: pdfParseRaw ? Object.keys(pdfParseRaw) : []
  });

  if (typeof pdfParseRaw === "function") {
    pdfParse = pdfParseRaw;
  } else if (pdfParseRaw && typeof pdfParseRaw.default === "function") {
    pdfParse = pdfParseRaw.default;
  } else if (pdfParseRaw && typeof pdfParseRaw.pdfParse === "function") {
    pdfParse = pdfParseRaw.pdfParse;
  } else if (pdfParseRaw) {
    const funcKey = Object.keys(pdfParseRaw).find(k => typeof (pdfParseRaw as any)[k] === "function");
    if (funcKey) {
      console.log(`[SERVER-PDF-INIT] Auto-resolved to function property "${funcKey}"`);
      pdfParse = (pdfParseRaw as any)[funcKey];
    }
  }
} catch (e: any) {
  console.error("[SERVER-PDF-INIT] Failed to parse default key resolver:", e);
}

let mammoth: any = null;
try {
  console.log("[SERVER-DOCX-INIT] Raw mammoth loading metrics:", {
    typeof_raw: typeof mammothRaw,
    keys: mammothRaw ? Object.keys(mammothRaw) : []
  });
  
  if (mammothRaw && typeof mammothRaw.extractRawText === "function") {
    mammoth = mammothRaw;
  } else if (mammothRaw && mammothRaw.default && typeof mammothRaw.default.extractRawText === "function") {
    mammoth = mammothRaw.default;
  } else if (mammothRaw) {
    if (typeof mammothRaw === "function" && (mammothRaw as any).extractRawText) {
      mammoth = mammothRaw;
    } else {
      const foundKey = Object.keys(mammothRaw).find(k => (mammothRaw as any)[k] && typeof (mammothRaw as any)[k].extractRawText === "function");
      if (foundKey) {
        console.log(`[SERVER-DOCX-INIT] Auto-resolved to property "${foundKey}"`);
        mammoth = (mammothRaw as any)[foundKey];
      }
    }
  }
} catch (e: any) {
  console.error("[SERVER-DOCX-INIT] Failed to resolve mammoth structure:", e);
}

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

// Dynamic CORS enabling localhost, Vercel deployments, and AI Studio development environments
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.includes("run.app") ||
        origin.includes("google.com");
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

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
  console.log("[ROUTE-HEALTH] Health probed at", new Date().toISOString());
  res.json({ status: "ok", time: new Date() });
});

// DIAGNOSTIC TEST PDF-PARSE ENDPOINT
app.post("/api/test-pdf-parse", async (req, res) => {
  try {
    console.log("[ROUTE-TEST-PDF] Initiating PDF extraction check...");
    const { fileData } = req.body;
    
    if (!fileData) {
      console.log("[ROUTE-TEST-PDF] No base64 fileData received. Providing parser configuration blueprint.");
      return res.json({
        success: true,
        step: "diagnostic-init",
        message: "Send base64 PDF strings inside 'fileData' to test full conversion pipeline.",
        parserConfig: {
          typeof_raw: typeof pdfParseRaw,
          typeof_resolved: typeof pdfParse,
          raw_keys: pdfParseRaw ? Object.keys(pdfParseRaw) : [],
          resolved_keys: pdfParse ? Object.keys(pdfParse) : []
        }
      });
    }

    console.log("[ROUTE-TEST-PDF] Decoding user base64 string...");
    const buffer = Buffer.from(fileData, "base64");
    console.log(`[ROUTE-TEST-PDF] Decoded ${buffer.length} bytes. Running extractor...`);
    
    const text = await extractTextFromBuffer(buffer, "application/pdf");
    console.log(`[ROUTE-TEST-PDF] Completed successfully. Extracted text length: ${text.length}`);
    
    return res.json({
      success: true,
      step: "pdf-parse-execution",
      length: text.length,
      sample: text.slice(0, 300)
    });
  } catch (err: any) {
    console.error("[ROUTE-TEST-PDF-FATAL] PDF execution test failed:", err);
    return res.status(500).json({
      success: false,
      step: "pdf-parse-execution",
      error: err.message || String(err)
    });
  }
});

// ANALYZE RESUME ENDPOINT
app.post("/api/analyze-resume", async (req, res) => {
  try {
    console.log("[ROUTE-ANALYZE] Received payload on resume analysis...");
    const { fileData, fileName, fileType, jobDescription } = req.body;

    if (!fileData) {
      console.warn("[ROUTE-ANALYZE-WARN] Missing 'fileData' in parameters");
      return res.status(400).json({ 
        success: false, 
        step: "parameters-validation", 
        error: "No file data provided." 
      });
    }

    console.log("[CODE-PATH-TRACE] [STAGE 1: Upload] Received base64 payload.");
    const buffer = Buffer.from(fileData, "base64");
    
    // Log required Upload details
    console.log(`[ROUTE-ANALYZE-AUDIT] Uploaded file size: ${buffer.length} bytes`);
    console.log(`[ROUTE-ANALYZE-AUDIT] File type: ${fileType || "unknown"}`);

    console.log("[CODE-PATH-TRACE] [STAGE 2: Parse PDF / DOCX] Executing extractTextFromBuffer...");
    let resumeText = "";
    try {
      resumeText = await extractTextFromBuffer(buffer, fileType || "");
    } catch (parseErr: any) {
      console.error("[ROUTE-ANALYZE] Failed during pdf/docx binary extraction:", parseErr);
      return res.status(500).json({
        success: false,
        step: "document-parsing",
        error: "File extraction sub-pipeline failed: " + parseErr.message
      });
    }

    console.log("[CODE-PATH-TRACE] [STAGE 3: Extract Text] Extraction complete.");
    // Log required Extracted details
    console.log(`[ROUTE-ANALYZE-AUDIT] Extracted text length: ${resumeText ? resumeText.length : 0} characters`);
    console.log(`[ROUTE-ANALYZE-AUDIT] First 500 characters of extracted text: "${resumeText ? resumeText.slice(0, 500) : ""}"`);

    // Validation check: If extracted text length < 100 characters, return "Resume text extraction failed"
    if (!resumeText || resumeText.trim().length < 100) {
      console.warn(`[ROUTE-ANALYZE-WARN] Validation failed. Extracted text too short: ${resumeText ? resumeText.length : 0} chars.`);
      return res.status(400).json({
        success: false,
        step: "document-parsing",
        error: "Resume text extraction failed"
      });
    }

    console.log("[CODE-PATH-TRACE] [STAGE 4: AI Router] Routing to generative model evaluation...");

    const hasKeys = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
    if (!hasKeys) {
      console.log("[ROUTE-ANALYZE] No active AI provider API keys detected in environment. Triggering simulation flow.");
      try {
        const simulatedReview = generateFallbackReview(resumeText);
        return res.json({
          success: true,
          method: "simulated-mode",
          analysis: simulatedReview,
          resumeText
        });
      } catch (simError: any) {
        console.error("[ROUTE-ANALYZE] Simulation generator failed:", simError);
        return res.status(500).json({
          success: false,
          step: "simulation-fallback",
          error: "Simulated review generation failed: " + simError.message
        });
      }
    }

    console.log("[ROUTE-ANALYZE] Calling active fallback AI Router cascade...");
    try {
      const result = await analyzeResume(resumeText, jobDescription);
      console.log(`[ROUTE-ANALYZE-SUCCESS] Strategy completed successfully via provider: ${result.provider}`);
      return res.json({
        success: true,
        method: result.provider,
        analysis: result.data,
        resumeText
      });
    } catch (routeError: any) {
      console.error("[ROUTE-ANALYZE-ERROR] AI provider chains failed:", routeError);
      return res.status(500).json({
        success: false,
        step: "ai-router-cascade",
        error: "All AI providers in fallback routing chain failed: " + routeError.message
      });
    }
  } catch (error: any) {
    console.error("[ROUTE-ANALYZE-FATAL] Unexpected error in analyze-resume handler:", error);
    res.status(500).json({ 
      success: false, 
      step: "handler-fatal", 
      error: "Unexpected internal handler exception: " + error.message 
    });
  }
});

// JOB MATCH ENDPOINT
app.post("/api/job-match", async (req, res) => {
  try {
    console.log("[ROUTE-MATCH] Job comparison request received");
    const { resumeText, jobDescription } = req.body;
    
    if (!resumeText || !jobDescription) {
      console.warn("[ROUTE-MATCH-WARN] Missing required parameters: resumeText or jobDescription");
      return res.status(400).json({ 
        success: false, 
        step: "parameters-validation", 
        error: "Missing resume text or job description." 
      });
    }

    const hasKeys = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
    if (!hasKeys) {
      console.log("[ROUTE-MATCH] AI keys missing. Resolving with dynamic simulation strategy.");
      try {
        const fallback = generateFallbackJobMatch(resumeText, jobDescription);
        return res.json({ success: true, method: "simulated-mode", analysis: fallback });
      } catch (simError: any) {
        return res.status(500).json({
          success: false,
          step: "simulation-fallback",
          error: "Job-match simulation failed: " + simError.message
        });
      }
    }

    console.log("[ROUTE-MATCH] Running match analysis on AI Router system...");
    try {
      const result = await matchJobDescription(resumeText, jobDescription);
      console.log(`[ROUTE-MATCH-SUCCESS] Strategy resolved via provider: ${result.provider}`);
      return res.json({ success: true, method: result.provider, analysis: result.data });
    } catch (routeError: any) {
      console.error("[ROUTE-MATCH-ERROR] AI Matching Router failed:", routeError);
      return res.status(500).json({
        success: false,
        step: "ai-router-cascade",
        error: "All AI matching engines failed: " + routeError.message
      });
    }
  } catch (error: any) {
    console.error("[ROUTE-MATCH-FATAL] Unexpected error in job-match handler:", error);
    res.status(500).json({ 
      success: false, 
      step: "handler-fatal", 
      error: "Unexpected internal server error: " + error.message 
    });
  }
});

// GENERATE COVER LETTER ENDPOINT
app.post("/api/generate-cover-letter", async (req, res) => {
  try {
    console.log("[ROUTE-COVER] Requesting custom cover letter generation...");
    const { resumeText, jobDescription } = req.body;
    
    if (!resumeText || !jobDescription) {
      console.warn("[ROUTE-COVER-WARN] Parameters validation failed. Missing resumeText or jobDescription");
      return res.status(400).json({ 
        success: false, 
        step: "parameters-validation", 
        error: "Resume details and Job Description are required for custom cover letters." 
      });
    }

    const hasKeys = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
    if (!hasKeys) {
      console.log("[ROUTE-COVER] Missing AI keys. Servicing via premium simulation.");
      try {
        const fallback = generateFallbackCoverLetter(resumeText, jobDescription);
        return res.json({ success: true, method: "simulated-mode", coverLetter: fallback });
      } catch (simError: any) {
        return res.status(500).json({
          success: false,
          step: "simulation-fallback",
          error: "Simulated cover-letter failed: " + simError.message
        });
      }
    }

    console.log("[ROUTE-COVER] Generating letters using AI Router chain...");
    try {
      const result = await generateCoverLetter(resumeText, jobDescription);
      console.log(`[ROUTE-COVER-SUCCESS] letter completed via provider: ${result.provider}`);
      return res.json({ success: true, method: result.provider, coverLetter: result.data });
    } catch (routeError: any) {
      console.error("[ROUTE-COVER-ERROR] Cover letter generation router failed:", routeError);
      return res.status(500).json({
        success: false,
        step: "ai-router-cascade",
        error: "AI letter generators failed: " + routeError.message
      });
    }
  } catch (error: any) {
    console.error("[ROUTE-COVER-FATAL] Unexpected exception in server cover-letter handler:", error);
    res.status(500).json({ 
      success: false, 
      step: "handler-fatal", 
      error: "Cover letter endpoint fatal error: " + error.message 
    });
  }
});

// GENERATE RESUME STRUC ENDPOINT (RESUME BUILDER)
app.post("/api/generate-resume-builder", async (req, res) => {
  try {
    console.log("[ROUTE-BUILDER] Constructing resume architectures...");
    const { experience, skills, role } = req.body;

    const client = getGeminiClient();
    if (!client) {
      console.log("[ROUTE-BUILDER] Gemini client is not initialized (missing api key). Defaulting to builder simulation.");
      try {
        const fallback = generateFallbackResumeBuilder(experience, skills, role);
        return res.json({ success: true, method: "simulation", resume: fallback });
      } catch (simError: any) {
        return res.status(500).json({
          success: false,
          step: "simulation-fallback",
          error: "Resume simulation generator failed: " + simError.message
        });
      }
    }

    console.log("[ROUTE-BUILDER] Invoking Gemini Content engine on resume blueprint...");
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

    try {
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
        console.log("[ROUTE-BUILDER-SUCCESS] Structured JSON parsed correctly.");
        return res.json({ success: true, method: "gemini", resume: parsed });
      } catch (parseJsonError) {
        console.warn("[ROUTE-BUILDER-WARN] Raw JSON parsing failed. Executing helper fallback structure.");
        return res.json({
          success: true,
          method: "fallback",
          resume: generateFallbackResumeBuilder(experience, skills, role)
        });
      }
    } catch (gemError: any) {
      console.error("[ROUTE-BUILDER-ERROR] Gemini server generation error:", gemError);
      return res.status(500).json({
        success: false,
        step: "gemini-generation-call",
        error: "Gemini server failed with message: " + gemError.message
      });
    }
  } catch (error: any) {
    console.error("[ROUTE-BUILDER-FATAL] Root builder exception:", error);
    res.status(500).json({ 
      success: false, 
      step: "handler-fatal", 
      error: "Builder endpoint failed: " + error.message 
    });
  }
});

// GENERATE CAREER ROADMAP ENDPOINT
app.post("/api/generate-roadmap", async (req, res) => {
  try {
    console.log("[ROUTE-ROADMAP] Initiating professional path advisor...");
    const { skills, role } = req.body;

    const hasKeys = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
    if (!hasKeys) {
      console.log("[ROUTE-ROADMAP] No AI keys present. Routing to premium math projection simulator.");
      try {
        const fallback = generateFallbackRoadmap(skills, role);
        return res.json({ success: true, method: "simulated-mode", roadmap: fallback });
      } catch (simError: any) {
        return res.status(500).json({
          success: false,
          step: "simulation-fallback",
          error: "Roadmap system simulations failed: " + simError.message
        });
      }
    }

    console.log("[ROUTE-ROADMAP] Passing constraints to AI route advisors.");
    try {
      const result = await generateCareerRoadmap(skills, role);
      console.log(`[ROUTE-ROADMAP-SUCCESS] Finished path mapping via: ${result.provider}`);
      return res.json({ success: true, method: result.provider, roadmap: result.data });
    } catch (routeError: any) {
      console.error("[ROUTE-ROADMAP-ERROR] All growth advisors failed:", routeError);
      return res.status(500).json({
        success: false,
        step: "ai-router-cascade",
        error: "System advisors failed: " + routeError.message
      });
    }
  } catch (error: any) {
    console.error("[ROUTE-ROADMAP-FATAL] Roadmap advisor process exception:", error);
    res.status(500).json({ 
      success: false, 
      step: "handler-fatal", 
      error: "Internal advisor exception: " + error.message 
    });
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
