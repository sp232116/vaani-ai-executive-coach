import { analyzeCommunication } from "@/services/ai";

export const runtime = "nodejs";

const maxAudioSize = 25 * 1024 * 1024;
const audioMimeTypes = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  webm: "audio/webm",
};

function getProviderError(error) {
  const rawMessage = error instanceof Error ? error.message : "";
  let parsedError;

  try {
    parsedError = JSON.parse(rawMessage)?.error;
  } catch {
    parsedError = undefined;
  }

  const status =
    typeof error?.status === "number" ? error.status : parsedError?.code;
  const message =
    typeof parsedError?.message === "string"
      ? parsedError.message
      : rawMessage && !rawMessage.trim().startsWith("{")
        ? rawMessage
        : "Gemini request failed.";

  return { status, message };
}

function getFormValue(formData, name) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function parseWorries(value) {
  if (!value) return [];

  try {
    const worries = JSON.parse(value);

    if (Array.isArray(worries) && worries.every((worry) => typeof worry === "string")) {
      return worries;
    }
  } catch {
    // The route returns a validation response below.
  }

  throw new Error("The worries field must be a JSON array of strings.");
}

export async function POST(request) {
  let formData;

  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: "Request body must use multipart/form-data." },
      { status: 400 },
    );
  }

  const audio = formData.get("audio");

  if (!audio || typeof audio === "string" || typeof audio.arrayBuffer !== "function") {
    return Response.json(
      { error: "An audio file is required." },
      { status: 400 },
    );
  }

  const extension = audio.name.split(".").pop()?.toLowerCase();
  const mimeType = audioMimeTypes[extension];

  if (!mimeType) {
    return Response.json(
      { error: "Unsupported audio type. Use MP3, WAV, M4A, or WebM." },
      { status: 415 },
    );
  }

  if (audio.size > maxAudioSize) {
    return Response.json(
      { error: "Audio files must be 25 MB or smaller." },
      { status: 413 },
    );
  }

  let worries;

  try {
    worries = parseWorries(getFormValue(formData, "worries"));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status: 400 },
    );
  }

  const audioData = Buffer.from(await audio.arrayBuffer()).toString("base64");

  try {
    const result = await analyzeCommunication({
      audio: {
        mimeType,
        data: audioData,
      },
      context: {
        selectedExecutiveMoment: getFormValue(formData, "selected_executive_moment"),
        conversationType: getFormValue(formData, "conversation_type"),
        audience: getFormValue(formData, "audience"),
        desiredOutcome: getFormValue(formData, "desired_outcome"),
        worries,
      },
    });

    return Response.json(result);
  } catch (error) {
    const providerError = getProviderError(error);
    const status =
      Number.isInteger(providerError.status) &&
      providerError.status >= 400 &&
      providerError.status <= 599
        ? providerError.status
        : 502;

    console.error("[Analyze] Gemini analysis failed.", {
      status,
      message: providerError.message,
    });

    if (status === 429) {
      return Response.json(
        {
          success: false,
          provider: "gemini",
          retryable: true,
          code: 429,
          message: "Gemini rate limit exceeded. Please retry in about one minute.",
        },
        { status },
      );
    }

    if (status === 503) {
      return Response.json(
        {
          success: false,
          provider: "gemini",
          retryable: true,
          code: 503,
          message: "Gemini is temporarily unavailable.",
        },
        { status },
      );
    }

    return Response.json(
      {
        success: false,
        provider: "gemini",
        retryable: false,
        code: status,
        message: providerError.message,
      },
      { status },
    );
  }
}
