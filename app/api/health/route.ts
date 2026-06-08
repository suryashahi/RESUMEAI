export async function GET() {
  return Response.json({
    status: "ok",
    time: new Date(),
    framework: "Next.js App Router API Route"
  });
}
