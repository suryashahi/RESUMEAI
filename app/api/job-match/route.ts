import { matchJobDescription } from "../../../src/lib/ai-router";
import { generateFallbackJobMatch } from "../../../src/lib/backend-helpers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { resumeText, jobDescription } = body;

    if (!resumeText || !jobDescription) {
      return Response.json({ error: "Missing resume text or job description." }, { status: 400 });
    }

    const hasKeys = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
    if (!hasKeys) {
      const fallback = generateFallbackJobMatch(resumeText, jobDescription);
      return Response.json({ success: true, method: "simulated-mode", analysis: fallback });
    }

    try {
      const result = await matchJobDescription(resumeText, jobDescription);
      return Response.json({ success: true, method: result.provider, analysis: result.data });
    } catch (routeError: any) {
      console.error("[VERCEL-API] AI Fallback Router failed on matchJobDescription:", routeError);
      return Response.json({
        error: "All AI providers in fallback system failed: " + routeError.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in Next.js job-match API:", error);
    return Response.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}
