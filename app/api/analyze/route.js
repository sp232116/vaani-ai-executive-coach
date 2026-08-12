import { analyzeCommunication } from "@/services/ai";
import { momentCriteria } from "@/lib/analysisSchema";

export const runtime = "nodejs";

const maxAudioSize = 25 * 1024 * 1024;
const audioMimeTypes = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  webm: "audio/webm",
};
const allowedMimeTypes = {
  mp3: new Set(["audio/mpeg", "audio/mp3", "audio/x-mp3"]),
  wav: new Set(["audio/wav", "audio/x-wav", "audio/vnd.wave", "audio/wave"]),
  m4a: new Set(["audio/mp4", "audio/x-m4a", "audio/m4a"]),
  webm: new Set(["audio/webm"]),
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

function isRequiredText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasExpectedAudioSignature(audioBuffer, extension) {
  if (extension === "mp3") {
    return (
      audioBuffer.subarray(0, 3).toString("ascii") === "ID3" ||
      (audioBuffer.length >= 2 &&
        audioBuffer[0] === 0xff &&
        (audioBuffer[1] & 0xe0) === 0xe0)
    );
  }

  if (extension === "wav") {
    return (
      audioBuffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      audioBuffer.subarray(8, 12).toString("ascii") === "WAVE"
    );
  }

  if (extension === "m4a") {
    return audioBuffer.subarray(4, 8).toString("ascii") === "ftyp";
  }

  return (
    audioBuffer.length >= 4 &&
    audioBuffer[0] === 0x1a &&
    audioBuffer[1] === 0x45 &&
    audioBuffer[2] === 0xdf &&
    audioBuffer[3] === 0xa3
  );
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

  if (audio.size === 0) {
    return Response.json(
      { message: "Choose an audio file that contains a recording." },
      { status: 400 },
    );
  }

  const submittedMimeType =
    typeof audio.type === "string" ? audio.type.split(";")[0].toLowerCase() : "";
  if (submittedMimeType && !allowedMimeTypes[extension].has(submittedMimeType)) {
    return Response.json(
      { message: "The audio file type does not match its file format. Choose an MP3, WAV, M4A, or WebM audio file." },
      { status: 415 },
    );
  }

  const selectedExecutiveMoment = getFormValue(formData, "selected_executive_moment");
  const conversationType = getFormValue(formData, "conversation_type");
  const audience = getFormValue(formData, "audience");
  const desiredOutcome = getFormValue(formData, "desired_outcome");

  if (!Object.hasOwn(momentCriteria, selectedExecutiveMoment)) {
    return Response.json(
      { message: "Choose an executive moment before requesting coaching." },
      { status: 400 },
    );
  }

  if (!isRequiredText(conversationType) || !isRequiredText(audience) || !isRequiredText(desiredOutcome)) {
    return Response.json(
      { message: "Complete your conversation type, audience, and desired outcome before requesting coaching." },
      { status: 400 },
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

  const audioBuffer = Buffer.from(await audio.arrayBuffer());

  if (!hasExpectedAudioSignature(audioBuffer, extension)) {
    return Response.json(
      { message: "This file does not appear to be a valid MP3, WAV, M4A, or WebM audio recording." },
      { status: 415 },
    );
  }

  const audioData = audioBuffer.toString("base64");

  try {
    const result = await analyzeCommunication({
      audio: {
        mimeType,
        data: audioData,
      },
      context: {
        selectedExecutiveMoment,
        conversationType,
        audience,
        desiredOutcome,
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
