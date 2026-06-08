import { createRequire } from "module";
import path from "path";

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
  console.log("[EXTRACTOR-PDF-INIT] Raw pdf-parse loading metrics:", {
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
      console.log(`[EXTRACTOR-PDF-INIT] Auto-resolved to function property "${funcKey}"`);
      pdfParse = (pdfParseRaw as any)[funcKey];
    }
  }
} catch (e: any) {
  console.error("[EXTRACTOR-PDF-INIT] Failed to parse default key resolver:", e);
}

let mammoth: any = null;
try {
  console.log("[EXTRACTOR-DOCX-INIT] Raw mammoth loading metrics:", {
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
        console.log(`[EXTRACTOR-DOCX-INIT] Auto-resolved to property "${foundKey}"`);
        mammoth = (mammothRaw as any)[foundKey];
      }
    }
  }
} catch (e: any) {
  console.error("[EXTRACTOR-DOCX-INIT] Failed to resolve mammoth structure:", e);
}

async function extractWithPdfJS(buffer: Buffer): Promise<string> {
  console.log("[EXTRACTOR-PDFJS] Initializing pdfjs-dist fallback extraction...");
  let pdfjs: any = null;
  try {
    pdfjs = requireShared("pdfjs-dist");
  } catch (err1) {
    console.log("[EXTRACTOR-PDFJS] Standard require('pdfjs-dist') failed, attempting legacy build path...", err1);
    try {
      pdfjs = requireShared("pdfjs-dist/legacy/build/pdf.js");
    } catch (err2) {
      console.error("[EXTRACTOR-PDFJS-FATAL] All pdfjs-dist import formats failed inside commonjs mapping:", err2);
      throw new Error("Could not import pdfjs-dist in this environment.");
    }
  }

  if (!pdfjs) {
    throw new Error("Resolved pdfjs-dist module is undefined.");
  }

  const data = new Uint8Array(buffer);
  const loadingTask = pdfjs.getDocument({
    data: data,
    useSystemFonts: false,
    disableFontFace: true
  });

  const pdf = await loadingTask.promise;
  console.log(`[EXTRACTOR-PDFJS] PDF loaded by pdfjs. Pages: ${pdf.numPages}`);
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str || "")
      .join(" ");
    fullText += pageText + "\n";
  }
  return fullText;
}

function extractTextFallback(buffer: Buffer): string {
  console.log("[EXTRACTOR-FALLBACK] Running heuristic plain-text regex extraction...");
  const str = buffer.toString("binary");
  // Find text elements within standard PDF parentheses: e.g. (Some Text) Tj
  const matches = str.match(/\(([^)]+)\)\s*Tj/g) || str.match(/\(([^)]+)\)/g) || [];
  let extracted = matches
    .map(m => {
      const inside = m.match(/\((.*)\)/);
      return inside ? inside[1] : "";
    })
    .filter(t => t && t.length > 2 && !t.includes("/") && !t.includes("\\") && /[a-zA-Z0-9\s]/.test(t))
    .join(" ");

  if (extracted.trim().length < 100) {
    console.log("[EXTRACTOR-FALLBACK] Parenthesis parser returned too little text. Using regex sweep for printable alphanumeric structures...");
    const asciiStr = buffer.toString("utf-8");
    const sweepMatches = asciiStr.match(/[a-zA-Z0-9\s.,/@:()-]{4,100}/g) || [];
    extracted = sweepMatches
      .map(v => v.trim())
      .filter(v => v.length > 3 && !v.includes("PDF-") && !v.includes("obj") && !v.includes("endobj"))
      .join(" ");
  }
  return extracted;
}

// PDF/DOCX text extraction helper
export async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  console.log(`[EXTRACTOR-START] Pipeline activated. File size: ${buffer.length} bytes, MimeType: ${mimeType}`);
  
  if (mimeType === "application/pdf" || mimeType.includes("pdf")) {
    let extractedText = "";

    // Attempt 1: pdf-parse
    try {
      console.log("[EXTRACTOR-PDF-STAGE1] Running pdf-parse on buffer...");
      if (typeof pdfParse !== "function") {
        throw new TypeError("pdfParse is not a function in the resolved workspace.");
      }
      
      const parsed = await pdfParse(buffer);
      console.log("[EXTRACTOR-PDF-STAGE1] pdf-parse execution success. Checking text content integrity...");
      if (parsed && typeof parsed.text === "string" && parsed.text.trim().length >= 100) {
        console.log(`[EXTRACTOR-PDF-STAGE1-SUCCESS] Valid text verified. Length: ${parsed.text.trim().length}`);
        return parsed.text;
      } else {
        throw new Error(`pdf-parse returned insufficient text length (${parsed?.text?.trim()?.length || 0} chars)`);
      }
    } catch (err: any) {
      console.warn(`[EXTRACTOR-PDF-STAGE1-FAILED] pdf-parse failed: ${err.message || String(err)}. Cascading to pdfjs-dist fallback...`);
    }

    // Attempt 2: pdfjs-dist
    try {
      extractedText = await extractWithPdfJS(buffer);
      if (extractedText && extractedText.trim().length >= 100) {
        console.log(`[EXTRACTOR-PDF-STAGE2-SUCCESS] pdfjs-dist extraction successful. Length: ${extractedText.trim().length}`);
        return extractedText;
      } else {
        throw new Error(`pdfjs-dist returned insufficient text length (${extractedText?.trim()?.length || 0} chars)`);
      }
    } catch (pdfjsErr: any) {
      console.warn(`[EXTRACTOR-PDF-STAGE2-FAILED] pdfjs-dist failed: ${pdfjsErr.message || String(pdfjsErr)}. Cascading to heuristic sweep...`);
    }

    // Attempt 3: Heuristic Regex Fallback
    try {
      extractedText = extractTextFallback(buffer);
      console.log(`[EXTRACTOR-PDF-STAGE3-COMPLETED] Heuristic sweep finished. Length: ${extractedText.length}`);
      return extractedText;
    } catch (fallbackErr: any) {
      console.error("[EXTRACTOR-PDF-STAGE3-FAILED] Heuristic fallback failed:", fallbackErr);
      return "";
    }
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
    mimeType.includes("officedocument") ||
    mimeType.includes("msword")
  ) {
    try {
      console.log("[EXTRACTOR-DOCX] Initializing mammoth extraction...");
      if (!mammoth || typeof mammoth.extractRawText !== "function") {
        console.error("[EXTRACTOR-DOCX-ERROR] mammoth has no extractRawText function!", {
          typeof_raw: typeof mammothRaw,
          typeof_resolved: typeof mammoth,
          raw_keys: mammothRaw ? Object.keys(mammothRaw) : []
        });
        throw new TypeError("Compiled loader error: mammoth.extractRawText is not a function.");
      }
      
      const result = await mammoth.extractRawText({ buffer });
      console.log(`[EXTRACTOR-DOCX-SUCCESS] Extracted successfully. Raw length: ${result.value?.length || 0}`);
      return result.value || "";
    } catch (err: any) {
      console.error("[EXTRACTOR-DOCX-FATAL] Word parsing failed:", err);
      return buffer.toString("utf-8");
    }
  } else {
    console.log("[EXTRACTOR-LOG] Unknown mimetype. Parsing raw generic UTF-8...");
    return buffer.toString("utf-8");
  }
}

// Generate fallback metadata for simulated reviews if Gemini API key is not present
export function generateFallbackReview(resumeText: string) {
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

export function generateFallbackJobMatch(resumeText: string, jobDesc: string) {
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

export function generateFallbackCoverLetter(resumeText: string, jobDesc: string) {
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

export function generateFallbackResumeBuilder(experience: string, skills: string, role: string) {
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

export function generateFallbackRoadmap(skills: string, role: string) {
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
