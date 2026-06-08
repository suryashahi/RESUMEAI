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
const pdfParse = typeof pdfParseRaw === "function" 
  ? pdfParseRaw 
  : (pdfParseRaw && pdfParseRaw.default ? pdfParseRaw.default : pdfParseRaw);

const mammoth = mammothRaw && mammothRaw.default ? mammothRaw.default : mammothRaw;

// PDF/DOCX text extraction helper
export async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  console.log(`[EXTRACTOR-START] Extracting text. Buffer size: ${buffer.length} bytes, MimeType: ${mimeType}`);
  
  if (mimeType === "application/pdf" || mimeType.includes("pdf")) {
    try {
      console.log("[EXTRACTOR-PDF] Initializing pdf-parse on buffer...");
      if (typeof pdfParse !== "function") {
        console.error("[EXTRACTOR-PDF-ERROR] pdf-parse is NOT a function!", {
          typeof_raw: typeof pdfParseRaw,
          typeof_resolved: typeof pdfParse,
          raw_keys: pdfParseRaw ? Object.keys(pdfParseRaw) : []
        });
        throw new TypeError("Compiled loader error: pdfParse is not a function.");
      }
      
      const data = await pdfParse(buffer);
      console.log(`[EXTRACTOR-PDF-SUCCESS] Text extracted successfully. Words: ${data.text ? data.text.split(/\s+/).length : 0}`);
      return data.text || "";
    } catch (err: any) {
      console.error("[EXTRACTOR-PDF-FATAL] pdf-parse failed, deploying smart text fallback:", err);
      // Fallback regex to capture printable ASCII from buffer
      return buffer.toString("utf-8").replace(/[^\x20-\x7E\r\n\t]/g, " ");
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
