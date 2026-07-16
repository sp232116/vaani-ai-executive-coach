import { GoogleGenAI } from "@google/genai";

const maxRetries = 3;
const responseFields = [
  "overall_score",
  "executive_readiness",
  "score_breakdown",
  "strengths",
  "growth_opportunities",
  "executive_rewrite",
  "practice_plan",
  "metadata",
];

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

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function buildAnalysisPrompt(context) {
  return `You are Vaani, an executive communication coach. Analyze the attached audio using this executive context:\n${JSON.stringify(context)}\n\nReturn only valid JSON. It must contain exactly these top-level fields: overall_score, executive_readiness, score_breakdown, strengths, growth_opportunities, executive_rewrite, practice_plan, metadata. Follow the complete contract in AI_RESPONSE_SCHEMA.md: score_breakdown must cover the selected moment criteria; strengths and growth_opportunities must be evidence-based; executive_rewrite must not invent facts; metadata must include schema_version, moment_id, rubric_version, analysis_status, generated_at, and limitations. Do not include markdown or any fields outside the contract.`;
}

function parseAnalysisResponse(response) {
  let result;

  try {
    result = JSON.parse(response.text);
  } catch {
    throw new Error("Gemini returned invalid JSON for the Vaani analysis schema.");
  }

  const resultFields = Object.keys(result).sort();
  const expectedFields = [...responseFields].sort();

  if (
    !result ||
    Array.isArray(result) ||
    resultFields.length !== expectedFields.length ||
    resultFields.some((field, index) => field !== expectedFields[index])
  ) {
    throw new Error("Gemini returned a response that does not match the Vaani analysis schema.");
  }

  return result;
}

export async function analyzeWithGemini(input) {
  const apiKey = process.env.GEMINI_API_KEY;
  const gemini = new GoogleGenAI({ apiKey });
  let lastError;

  const request = input
    ? {
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: input.audio.mimeType,
              data: input.audio.data,
            },
          },
          { text: buildAnalysisPrompt(input.context) },
        ],
        config: { responseMimeType: "application/json" },
      }
    : {
        model: "gemini-3.5-flash",
        contents: "Reply with the single word: healthy",
      };

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await gemini.models.generateContent(request);

      return input ? parseAnalysisResponse(response) : response;
    } catch (error) {
      lastError = error;

      if (getErrorStatus(error) !== 503 || attempt === maxRetries) {
        break;
      }

      await wait(500 * 2 ** attempt);
    }
  }

  throw lastError;
}
