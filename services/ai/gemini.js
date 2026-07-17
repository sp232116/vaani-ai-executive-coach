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
  return `You are Vaani, an exacting executive communication coach for corporate professionals, managers, founders, and senior leaders. Analyze the attached audio in the context below.\n\nEXECUTIVE CONTEXT\n${JSON.stringify(context)}\n\nCOACHING STANDARD\nAssess the response as a senior stakeholder would: does it lead with the business outcome, make a clear recommendation, demonstrate ownership, build leadership credibility, and make the next decision easy? Prioritize business-first communication, executive presence, recommendation-first structure, persuasion for senior stakeholders, and confidence without arrogance.\n\nFACTUAL GROUNDING\n- Never invent facts, achievements, metrics, responsibilities, projects, business outcomes, stakeholder priorities, or commitments that the user did not state. Do not infer claims such as increased test coverage, managed critical pipelines, improved revenue, or led projects without transcript evidence.\n- Preserve the user's original facts in every executive rewrite. Improve only framing, sequencing, clarity, recommendation strength, and executive presence.\n- If the transcript lacks evidence needed for a stronger business case, do not fabricate it. State exactly what proof would strengthen the case and use the exact phrase “mention your specific achievements here.” where an achievement or outcome is missing.\n\nFEEDBACK REQUIREMENTS\n- Ground every score, strength, opportunity, and rewrite in observable choices from the user's response.\n- Do not give generic advice such as “be more confident”, “improve communication”, or “speak clearly”.\n- For every growth opportunity, explain the missed executive signal, why it matters to the listener, what the listener is likely deciding or questioning, and the exact change to make.\n- Make guidance practical enough to rehearse in the next attempt. Use concrete wording, sequencing, or a short example—not abstract encouragement.\n- Treat confidence as calm ownership: use evidence, recommendations, and clear asks without overstating impact or inventing facts.\n- If the audio is too short, unclear, or incomplete, state the limitation in metadata.limitations and limit claims to what is observable.\n\nRETURN CONTRACT\nReturn only valid JSON, with no markdown or commentary outside the object. The response structure and field names must remain exactly stable between responses. It must contain exactly these top-level fields: overall_score, executive_readiness, score_breakdown, strengths, growth_opportunities, executive_rewrite, practice_plan, metadata. Follow AI_RESPONSE_SCHEMA.md exactly. Score breakdown must use the selected moment’s criteria. Strengths and growth opportunities must be evidence-based. Metadata must include schema_version, moment_id, rubric_version, analysis_status, generated_at, and limitations.`;
}

function parseAnalysisResponse(response) {
  let result;

  try {
    result = JSON.parse(response.text);
  } catch {
    console.error("Gemini returned invalid JSON:", response.text);
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

export async function analyzeWithGemini(input, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const gemini = new GoogleGenAI({ apiKey });
  let lastError;
  const retryLimit = Number.isInteger(options.maxRetries)
    ? options.maxRetries
    : maxRetries;

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

  for (let attempt = 0; attempt <= retryLimit; attempt += 1) {
    try {
      const response = await gemini.models.generateContent(request);

      return input ? parseAnalysisResponse(response) : response;
    } catch (error) {
      lastError = error;

      if (getErrorStatus(error) !== 503 || attempt === retryLimit) {
        break;
      }

      await wait(500 * 2 ** attempt);
    }
  }

  throw lastError;
}
