import { GoogleGenAI } from "@google/genai";
import { generateFallbackResumeBuilder } from "../../../src/lib/backend-helpers";

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { experience, skills, role } = body;

    const client = getGeminiClient();
    if (!client) {
      const fallback = generateFallbackResumeBuilder(experience, skills, role);
      return Response.json({ success: true, method: "simulation", resume: fallback });
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
      return Response.json({ success: true, method: "gemini", resume: parsed });
    } catch (e) {
      return Response.json({
        success: true,
        method: "fallback",
        resume: generateFallbackResumeBuilder(experience, skills, role)
      });
    }
  } catch (error: any) {
    console.error("Error in Next.js generate-resume-builder API:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
