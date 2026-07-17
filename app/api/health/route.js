import { analyzeCommunication } from "@/services/ai";

export const runtime = "nodejs";

function getErrorStatus(error) {
  if (typeof error?.status === "number") {
    return error.status;
  }

  try {
    return JSON.parse(error?.message)?.error?.code;
  } catch {
    return undefined;
  }
}

function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : "Unknown Gemini request failure.";
}


export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  console.info("Gemini API key present:", Boolean(process.env.GEMINI_API_KEY));

  if (!apiKey) {
    return Response.json(
      {
        success: false,
        provider: "gemini",
        error: "GEMINI_API_KEY is not configured.",
      },
      { status: 503 },
    );
  }

  try {
    await analyzeCommunication(
      undefined,
      process.env.NODE_ENV === "development" ? { maxRetries: 0 } : undefined,
    );

    return Response.json({ success: true, provider: "gemini" });
  } catch (error) {
    if (getErrorStatus(error) === 503) {
      return Response.json(
        {
          success: false,
          provider: "gemini",
          retryable: true,
          error: getErrorMessage(error),
        },
        { status: 503 },
      );
    }

    return Response.json(
      {
        success: false,
        provider: "gemini",
        error: getErrorMessage(error),
      },
      { status: 502 },
    );
  }
}
