import { generateCoverLetter } from "../../../src/lib/ai-router";
import { generateFallbackCoverLetter } from "../../../src/lib/backend-helpers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { resumeText, jobDescription } = body;

    if (!resumeText || !jobDescription) {
      return Response.json({ error: "Resume details and Job Description are required for custom cover letters." }, { status: 400 });
    }

    const hasKeys = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
    if (!hasKeys) {
      const fallback = generateFallbackCoverLetter(resumeText, jobDescription);
      return Response.json({ success: true, method: "simulated-mode", coverLetter: fallback });
    }

    try {
      const result = await generateCoverLetter(resumeText, jobDescription);
      return Response.json({ success: true, method: result.provider, coverLetter: result.data });
    } catch (routeError: any) {
      console.error("[VERCEL-API] AI Fallback Router failed on generateCoverLetter:", routeError);
      return Response.json({
        error: "All AI providers in fallback system failed: " + routeError.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in Next.js generate-cover-letter API:", error);
    return Response.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}
