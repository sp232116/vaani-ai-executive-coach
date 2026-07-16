import { analyzeCommunication } from "@/services/ai";

export const runtime = "nodejs";

const maxAudioSize = 25 * 1024 * 1024;
const audioMimeTypes = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  webm: "audio/webm",
};

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
    return Response.json({ error: getErrorMessage(error) }, { status: 400 });
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
    const providerStatus = getErrorStatus(error);
    const status =
      Number.isInteger(providerStatus) && providerStatus >= 400 && providerStatus <= 599
        ? providerStatus
        : 502;

    return Response.json({ error: getErrorMessage(error) }, { status });
  }
}
