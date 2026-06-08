import { analyzeResume } from "../../../src/lib/ai-router";
import { extractTextFromBuffer, generateFallbackReview } from "../../../src/lib/backend-helpers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileData, fileName, fileType, jobDescription } = body;

    if (!fileData) {
      return Response.json({ error: "No file data provided." }, { status: 400 });
    }

    const buffer = Buffer.from(fileData, "base64");
    const resumeText = await extractTextFromBuffer(buffer, fileType || "");

    const hasKeys = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
    if (!hasKeys) {
      const simulatedReview = generateFallbackReview(resumeText);
      return Response.json({
        success: true,
        method: "simulated-mode",
        analysis: simulatedReview,
        resumeText
      });
    }

    try {
      const result = await analyzeResume(resumeText, jobDescription);
      return Response.json({
        success: true,
        method: result.provider,
        analysis: result.data,
        resumeText
      });
    } catch (routeError: any) {
      console.error("[VERCEL-API] AI Fallback Router failed on analyzeResume:", routeError);
      return Response.json({
        error: "All AI providers in fallback system failed: " + routeError.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in Next.js analyze-resume API:", error);
    return Response.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}
