import { generateCareerRoadmap } from "../../../src/lib/ai-router";
import { generateFallbackRoadmap } from "../../../src/lib/backend-helpers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { skills, role } = body;

    const hasKeys = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
    if (!hasKeys) {
      const fallback = generateFallbackRoadmap(skills, role);
      return Response.json({ success: true, method: "simulated-mode", roadmap: fallback });
    }

    try {
      const result = await generateCareerRoadmap(skills, role);
      return Response.json({ success: true, method: result.provider, roadmap: result.data });
    } catch (routeError: any) {
      console.error("[VERCEL-API] AI Fallback Router failed on generateCareerRoadmap:", routeError);
      return Response.json({
        error: "All AI providers in fallback system failed: " + routeError.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in Next.js generate-roadmap API:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
