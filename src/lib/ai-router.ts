import { GoogleGenAI, Type } from "@google/genai";

// Re-map Types to match types.ts
export interface KeywordOptimizationItem {
  keyword: string;
  frequency: number;
  status: string;
  recommendation: string;
}

export interface GrammarIssueItem {
  original: string;
  correction: string;
  explanation: string;
}

export interface AnalysisData {
  overall_score: number;
  ats_score: number;
  skills_score: number;
  readability_score: number;
  recruiter_readiness_score: number;
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  keyword_optimization: KeywordOptimizationItem[];
  grammar_issues: GrammarIssueItem[];
  recommendations: string[];
}

export interface JobMatchData {
  match_percentage: number;
  missing_skills: string[];
  recommended_improvements: string[];
  recruiter_readiness_score: number;
  recruiter_feedback: string;
}

export interface CoverLetterData {
  subject: string;
  salutation: string;
  body: string[];
  sign_off: string;
}

export interface CareerRoadmapData {
  timeline: {
    plan_30_day: string[];
    plan_90_day: string[];
    plan_180_day: string[];
  };
  recommendations: {
    projects: {
      name: string;
      description: string;
    }[];
    courses: {
      name: string;
      platform: string;
    }[];
    resources: string[];
  };
}

// Lazy initializer for Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Cleans Markdown wrapper from JSON output
function cleanJsonOutput(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(json)?/, "");
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

/**
 * Generic Router that handles fallback routing chain:
 * 1. Gemini (Primary)
 * 2. OpenRouter Mixtral (Fallback #1)
 * 3. Groq Llama 3.3 (Fallback #2)
 */
async function callAIWithFallback<T>(
  prompt: string,
  systemInstruction?: string,
  geminiSchema?: any
): Promise<{ data: T; provider: string }> {
  const errors: Error[] = [];
  console.log("[AI-ROUTER] Entering callAIWithFallback pipeline.");
  console.log(`[AI-ROUTER] Prompt prefix sample: "${prompt.slice(0, 150)}..."`);
  console.log(`[AI-ROUTER] Keys present status: [Gemini: ${process.env.GEMINI_API_KEY ? "YES" : "NO"}, OpenRouter: ${process.env.OPENROUTER_API_KEY ? "YES" : "NO"}, Groq: ${process.env.GROQ_API_KEY ? "YES" : "NO"}]`);

  // Attempt 1: Gemini 2.5 Flash
  try {
    const client = getGeminiClient();
    if (!client) {
      throw new Error("Gemini API key is not configured.");
    }

    console.log("[AI-ROUTER-GEMINI] Routing primary request to Gemini...");
    
    const config: any = {
      responseMimeType: "application/json",
    };
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
      console.log(`[AI-ROUTER-GEMINI] With systeminstruction: "${systemInstruction.slice(0, 80)}..."`);
    }
    if (geminiSchema) {
      config.responseSchema = geminiSchema;
    }

    // Call Gemini with 15-second timeout safeguard
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn("[AI-ROUTER-GEMINI-TIMEOUT] Gemini did not respond within 15s. Aborting...");
      controller.abort();
    }, 15000);

    try {
      console.log("[AI-ROUTER-GEMINI] Requesting generateContent from Gemini client...");
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config,
      });
      clearTimeout(timeoutId);

      const text = response.text || "";
      console.log(`[AI-ROUTER-GEMINI-SUCCESS] Received response. Text length: ${text.length}. Parsing JSON...`);
      const cleaned = cleanJsonOutput(text);
      const parsed = JSON.parse(cleaned);
      console.log("[AI-ROUTER-GEMINI-SUCCESS] Successfully parsed Gemini JSON payload!");
      return { data: parsed as T, provider: "Gemini 2.5 Flash" };
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("[AI-ROUTER-GEMINI-ERROR] Exception in Gemini API pipeline:", err);
      throw err;
    }
  } catch (err: any) {
    console.error(`[AI-ROUTER] Gemini 2.5 Flash failed (Error: ${err.message || String(err)}). Cascading automatically to Mixtral...`);
    errors.push(err);
  }

  // Attempt 2: OpenRouter Mixtral 8x7B
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OpenRouter API key is not configured.");
    }

    console.log("[AI-ROUTER-OPENROUTER] Routing secondary request to OpenRouter Mixtral...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn("[AI-ROUTER-OPENROUTER-TIMEOUT] OpenRouter did not respond within 20s. Aborting...");
      controller.abort();
    }, 20000);

    try {
      console.log("[AI-ROUTER-OPENROUTER] Dispatching HTTP fetch to openrouter.ai...");
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://ai.studio/build",
          "X-Title": "ResumeAI",
        },
        body: JSON.stringify({
          model: "mistralai/mixtral-8x7b-instruct",
          messages: [
            ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
            { role: "user", content: prompt + "\n\nCRITICAL: Respond ONLY with a valid JSON block complying with the requested scheme. Do not output conversational preamble, explanations, or un-escaped markdown code." }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[AI-ROUTER-OPENROUTER-HTTP-ERROR] Stats: ${response.status}. Details:`, errText);
        throw new Error(`OpenRouter API responded with status ${response.status}: ${errText}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || "";
      console.log(`[AI-ROUTER-OPENROUTER-SUCCESS] Content returned length: ${content.length}. Parsing...`);
      const parsed = JSON.parse(cleanJsonOutput(content));
      console.log("[AI-ROUTER-OPENROUTER-SUCCESS] Successfully parsed OpenRouter response payload!");
      return { data: parsed as T, provider: "OpenRouter Mixtral 8x7B" };
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("[AI-ROUTER-OPENROUTER-ERROR] Exception in OpenRouter pipeline:", err);
      throw err;
    }
  } catch (err: any) {
    console.error(`[AI-ROUTER] OpenRouter Mixtral failed (Error: ${err.message || String(err)}). Cascading automatically to Groq Llama...`);
    errors.push(err);
  }

  // Attempt 3: Groq Llama 3.3 70B
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("Groq API key is not configured.");
    }

    console.log("[AI-ROUTER-GROQ] Routing tertiary request to Groq Llama 3.3 70B...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn("[AI-ROUTER-GROQ-TIMEOUT] Groq did not respond within 20s. Aborting...");
      controller.abort();
    }, 20000);

    try {
      console.log("[AI-ROUTER-GROQ] Dispatching HTTP fetch to api.groq.com...");
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
            { role: "user", content: prompt + "\n\nCRITICAL: Respond ONLY with a valid JSON block complying with the requested scheme. Do not output conversational preamble or explain your results." }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[AI-ROUTER-GROQ-HTTP-ERROR] Stats: ${response.status}. Details:`, errText);
        throw new Error(`Groq API responded with status ${response.status}: ${errText}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || "";
      console.log(`[AI-ROUTER-GROQ-SUCCESS] Content response text length: ${content.length}. Parsing...`);
      const parsed = JSON.parse(cleanJsonOutput(content));
      console.log("[AI-ROUTER-GROQ-SUCCESS] Successfully parsed Groq response!");
      return { data: parsed as T, provider: "Groq Llama 3.3" };
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("[AI-ROUTER-GROQ-ERROR] Exception in Groq API pipe:", err);
      throw err;
    }
  } catch (err: any) {
    console.error(`[AI-ROUTER] Groq Llama 3.3 failed (Error: ${err.message || String(err)}).`);
    errors.push(err);
  }

  // If all failed, throw unified friendly error
  throw new Error(
    "All available AI providers (Gemini, OpenRouter, and Groq) failed to complete this operation. " +
    "This can be due to temporary network issues, regional availability constraints, or invalid authentication on secrets. " +
    "Diagnostics:\n" +
    errors.map((e, idx) => `  Provider #${idx + 1}: ${e.message}`).join("\n")
  );
}

/**
 * 1. Analyze Resume
 */
export async function analyzeResume(
  resumeText: string,
  jobDescription?: string
): Promise<{ data: AnalysisData; provider: string }> {
  const prompt = `You are an elite automated recruiter. Analyze this candidate resume text and extract critical metrics. 
If a job description is supplied below, evaluate keyword optimizations, grammatical constructs, streaks, strengths, weaknesses, and ATS alignments.

${jobDescription ? `Target Job Description:\n${jobDescription}\n\n` : ""}
Candidate Resume Content:
${resumeText}

You MUST return a valid JSON object matching this schema exactly:
{
  "overall_score": 85,
  "ats_score": 80,
  "skills_score": 88,
  "readability_score": 90,
  "recruiter_readiness_score": 85,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "missing_skills": ["string"],
  "keyword_optimization": [
    { "keyword": "string", "frequency": 1, "status": "Good", "recommendation": "string" }
  ],
  "grammar_issues": [
    { "original": "string", "correction": "string", "explanation": "string" }
  ],
  "recommendations": ["string"]
}
`;

  const systemInstruction = "You are a professional recruiting evaluator. Return raw active JSON matching the requested schema strictly, avoiding markdown fencing format errors.";
  
  const geminiSchema = {
    type: Type.OBJECT,
    properties: {
      overall_score: { type: Type.INTEGER },
      ats_score: { type: Type.INTEGER },
      skills_score: { type: Type.INTEGER },
      readability_score: { type: Type.INTEGER },
      recruiter_readiness_score: { type: Type.INTEGER },
      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
      missing_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
      keyword_optimization: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            keyword: { type: Type.STRING },
            frequency: { type: Type.INTEGER },
            status: { type: Type.STRING, description: "Good | Missing | Optimize" },
            recommendation: { type: Type.STRING },
          },
          required: ["keyword", "frequency", "status", "recommendation"],
        },
      },
      grammar_issues: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            correction: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ["original", "correction", "explanation"],
        },
      },
      recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: [
      "overall_score",
      "ats_score",
      "skills_score",
      "readability_score",
      "recruiter_readiness_score",
      "strengths",
      "weaknesses",
      "missing_skills",
      "keyword_optimization",
      "grammar_issues",
      "recommendations"
    ],
  };

  return callAIWithFallback<AnalysisData>(prompt, systemInstruction, geminiSchema);
}

/**
 * 2. Compare Resume to Job Post
 */
export async function matchJobDescription(
  resumeText: string,
  jobDescription: string
): Promise<{ data: JobMatchData; provider: string }> {
  const prompt = `Compare this candidate resume against the target Job Description. Highlight percentage similarity coefficient, missing skills, improvements, and personalized recruiter feedback.

Candidate Resume:
${resumeText}

Target Job Description:
${jobDescription}

You MUST return a valid JSON object matching this schema exactly:
{
  "match_percentage": 75,
  "missing_skills": ["string"],
  "recommended_improvements": ["string"],
  "recruiter_readiness_score": 85,
  "recruiter_feedback": "string"
}
`;

  const systemInstruction = "You are an elite automated matcher. Return only the parsed JSON conforming to the structural specifications strictly.";

  const geminiSchema = {
    type: Type.OBJECT,
    properties: {
      match_percentage: { type: Type.INTEGER },
      missing_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
      recommended_improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
      recruiter_readiness_score: { type: Type.INTEGER },
      recruiter_feedback: { type: Type.STRING },
    },
    required: [
      "match_percentage",
      "missing_skills",
      "recommended_improvements",
      "recruiter_readiness_score",
      "recruiter_feedback"
    ],
  };

  return callAIWithFallback<JobMatchData>(prompt, systemInstruction, geminiSchema);
}

/**
 * 3. Generate Career Roadmap
 */
export async function generateCareerRoadmap(
  skills: string,
  role: string
): Promise<{ data: CareerRoadmapData; provider: string }> {
  const prompt = `Generate a rigorous, actionable career growth roadmap to assist a professional in transitioning into their target role.

Current Skills: ${skills || "None specified"}
Target Role: ${role || "None specified"}

You MUST return a valid JSON object matching this schema exactly:
{
  "timeline": {
    "plan_30_day": ["Action point"],
    "plan_90_day": ["Action point"],
    "plan_180_day": ["Action point"]
  },
  "recommendations": {
    "projects": [
      { "name": "Project name", "description": "High-impact description of what to build and practice" }
    ],
    "courses": [
      { "name": "Course Title", "platform": "Platform Name (Coursera, Udemy, etc)" }
    ],
    "resources": ["Resource or Tutorial link 1"]
  }
}
`;

  const systemInstruction = "You are a professional systems and career growth roadmap advisor. Formulate structured blueprints in JSON strictly.";

  const geminiSchema = {
    type: Type.OBJECT,
    properties: {
      timeline: {
        type: Type.OBJECT,
        properties: {
          plan_30_day: { type: Type.ARRAY, items: { type: Type.STRING } },
          plan_90_day: { type: Type.ARRAY, items: { type: Type.STRING } },
          plan_180_day: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["plan_30_day", "plan_90_day", "plan_180_day"],
      },
      recommendations: {
        type: Type.OBJECT,
        properties: {
          projects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["name", "description"],
            },
          },
          courses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                platform: { type: Type.STRING },
              },
              required: ["name", "platform"],
            },
          },
          resources: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["projects", "courses", "resources"],
      },
    },
    required: ["timeline", "recommendations"],
  };

  return callAIWithFallback<CareerRoadmapData>(prompt, systemInstruction, geminiSchema);
}

/**
 * 4. Generate Cover Letter
 */
export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string
): Promise<{ data: CoverLetterData; provider: string }> {
  const prompt = `Write a bespoke, highly persuasive cover letter leveraging the candidate's achievements to align directly with a target job description.

Candidate Resume details:
${resumeText}

Target Job Details:
${jobDescription}

You MUST return a valid JSON object matching this schema exactly:
{
  "subject": "string",
  "salutation": "string",
  "body": ["Paragraph 1", "Paragraph 2", "Paragraph 3"],
  "sign_off": "string"
}
`;

  const systemInstruction = "You are an elite editorial editor and cover letter strategist. Return exact JSON conforming to formatting limits.";

  const geminiSchema = {
    type: Type.OBJECT,
    properties: {
      subject: { type: Type.STRING },
      salutation: { type: Type.STRING },
      body: { type: Type.ARRAY, items: { type: Type.STRING } },
      sign_off: { type: Type.STRING },
    },
    required: ["subject", "salutation", "body", "sign_off"],
  };

  return callAIWithFallback<CoverLetterData>(prompt, systemInstruction, geminiSchema);
}
