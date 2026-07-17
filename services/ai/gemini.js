import { GoogleGenAI } from "@google/genai";
import { momentCriteria, validateAnalysisResponse } from "@/lib/analysisSchema";

const maxRetries = 3;

function requiredTextSchema(maxLength, description) {
  return {
    type: "string",
    minLength: 1,
    maxLength,
    description: `Required, non-empty text of at most ${maxLength} characters. ${description}`,
  };
}

const analysisResponseJsonSchema = {
  type: "object",
  properties: {
    overall_score: { type: "integer", minimum: 0, maximum: 100 },
    executive_readiness: {
      type: "object",
      properties: {
        level: { type: "string", enum: ["needs_foundation", "developing", "ready_with_opportunities", "strong_readiness"] },
        label: requiredTextSchema(60, "Use the label mapped to the selected readiness level."),
        summary: requiredTextSchema(450, "Give a concise, transcript-grounded executive assessment."),
      },
      required: ["level", "label", "summary"],
      additionalProperties: false,
    },
    score_breakdown: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          criterion: requiredTextSchema(80, "Use exactly one selected executive-moment criterion."),
          score: { type: "integer", minimum: 0, maximum: 100 },
          rationale: requiredTextSchema(300, "Give an observable, transcript-grounded rationale."),
        },
        required: ["criterion", "score", "rationale"],
        additionalProperties: false,
      },
    },
    strengths: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          title: requiredTextSchema(80, "Name an observable communication strength."),
          evidence: requiredTextSchema(300, "Reference observable communication without inventing facts."),
          impact: requiredTextSchema(250, "Explain the practical executive impact."),
        },
        required: ["title", "evidence", "impact"],
        additionalProperties: false,
      },
    },
    growth_opportunities: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          title: requiredTextSchema(100, "Name a coachable communication behavior."),
          guidance: requiredTextSchema(350, "Give one specific, actionable recommendation that can be rehearsed; do not use generic advice."),
          priority: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["title", "guidance", "priority"],
        additionalProperties: false,
      },
    },
    executive_rewrite: {
      type: "object",
      properties: {
        title: requiredTextSchema(80, "Name the portion of the communication being improved."),
        before: requiredTextSchema(500, "Use a faithful transcript excerpt or concise paraphrase."),
        after: requiredTextSchema(500, "Preserve the user's facts while improving framing."),
        note: requiredTextSchema(200, "Briefly explain that the rewrite is a practice direction, not a script to memorize."),
      },
      required: ["title", "before", "after", "note"],
      additionalProperties: false,
    },
    practice_plan: {
      type: "object",
      properties: {
        next_focus: requiredTextSchema(200, "Identify the most valuable next behavior to improve."),
        exercise: requiredTextSchema(350, "Give one short, feasible rehearsal exercise."),
        success_measure: requiredTextSchema(250, "Give a concrete, observable success measure."),
      },
      required: ["next_focus", "exercise", "success_measure"],
      additionalProperties: false,
    },
    metadata: {
      type: "object",
      properties: {
        schema_version: { type: "string", enum: ["1.0"] },
        moment_id: { type: "string", enum: ["promotion-appraisal", "stakeholder-update", "client-pitch", "difficult-conversation"] },
        rubric_version: { type: "string", enum: ["1.0"] },
        analysis_status: { type: "string", enum: ["complete"] },
        generated_at: { type: "string", format: "date-time", description: "ISO-8601 UTC timestamp; the server replaces this value." },
        limitations: { type: "array", items: requiredTextSchema(250, "State one concrete limitation only when applicable.") },
      },
      required: ["schema_version", "moment_id", "rubric_version", "analysis_status", "generated_at", "limitations"],
      additionalProperties: false,
    },
  },
  required: ["overall_score", "executive_readiness", "score_breakdown", "strengths", "growth_opportunities", "executive_rewrite", "practice_plan", "metadata"],
  additionalProperties: false,
};

class GeminiResponseError extends Error {
  constructor(message) {
    super(message);
    this.name = "GeminiResponseError";
    this.status = 502;
  }
}

function getErrorStatus(error) {
  if (typeof error?.status === "number") return error.status;

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
  const criteria = momentCriteria[context.selectedExecutiveMoment]?.join(", ") || "the selected moment's criteria";

  return `You are Vaani, an exacting executive communication coach for corporate professionals, managers, founders, and senior leaders. Analyze the attached audio in the context below.\n\nEXECUTIVE CONTEXT\n${JSON.stringify(context)}\n\nCOACHING STANDARD\nAssess the response as a senior stakeholder would: does it lead with the business outcome, make a clear recommendation, demonstrate ownership, build leadership credibility, and make the next decision easy? Prioritize business-first communication, executive presence, recommendation-first structure, persuasion for senior stakeholders, and confidence without arrogance.\n\nFACTUAL GROUNDING\n- Never invent facts, achievements, metrics, responsibilities, projects, business outcomes, stakeholder priorities, or commitments that the user did not state.\n- Preserve the user's original facts in every executive rewrite. Improve only framing, sequencing, clarity, recommendation strength, and executive presence.\n- If the transcript lacks evidence needed for a stronger business case, do not fabricate it. State exactly what proof would strengthen the case and use the exact phrase "mention your specific achievements here." where an achievement or outcome is missing.\n\nFEEDBACK REQUIREMENTS\n- Ground every score, strength, opportunity, and rewrite in observable choices from the user's response.\n- Do not give generic advice such as "be more confident", "improve communication", or "speak clearly".\n- For every growth opportunity, explain the missed executive signal, why it matters to the listener, what the listener is likely deciding or questioning, and the exact change to make.\n- Make guidance practical enough to rehearse in the next attempt. Use concrete wording, sequencing, or a short example—not abstract encouragement.\n- Each growth_opportunities[].guidance value must be a non-empty string of 350 characters or fewer.\n- executive_rewrite.note must be a non-empty string of 200 characters or fewer that says the rewrite is guidance for practice, not a script to memorize.\n- If the audio is too short, unclear, or incomplete, state the limitation in metadata.limitations and limit claims to what is observable.\n\nRETURN CONTRACT\nReturn one complete report matching the provided JSON schema. Do not omit nested fields, add fields, use null values, or wrap JSON in markdown. Use metadata.schema_version "1.0", metadata.rubric_version "1.0", metadata.analysis_status "complete", and metadata.moment_id "${context.selectedExecutiveMoment}". The three score_breakdown criteria must be exactly: ${criteria}. Use exactly three score_breakdown entries, two or three strengths, and two or three growth_opportunities with at least one "high" priority. Map readiness levels to labels exactly as follows: needs_foundation = "Needs Foundation"; developing = "Developing Executive Readiness"; ready_with_opportunities = "Ready with Improvement Opportunities"; strong_readiness = "Strong Executive Readiness". Set metadata.generated_at to any ISO-8601 UTC timestamp; the server will replace it with its generation time.`;
}

function extractJsonText(rawText) {
  const text = typeof rawText === "string" ? rawText.trim() : "";
  if (!text) throw new GeminiResponseError("Gemini returned an empty analysis response.");

  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) return fenced[1].trim();

  if (text.startsWith("{") && text.endsWith("}")) return text;

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) return text.slice(firstBrace, lastBrace + 1);

  return text;
}

function normalizeAnalysisResponse(result) {
  if (!result || typeof result !== "object") return result;

  if (Array.isArray(result.growth_opportunities)) {
    result.growth_opportunities.forEach((opportunity) => {
      if (typeof opportunity?.guidance === "string") {
        opportunity.guidance = opportunity.guidance.trim();
      }
    });
  }

  if (typeof result.executive_rewrite?.note === "string") {
    result.executive_rewrite.note = result.executive_rewrite.note.trim();
  }

  return result;
}

function describeTextValue(value) {
  return {
    type: Array.isArray(value) ? "array" : typeof value,
    length: typeof value === "string" ? value.length : undefined,
    isBlank: typeof value === "string" ? value.trim().length === 0 : undefined,
  };
}

function parseAnalysisResponse(response, expectedMomentId) {
  const rawText = response?.text;
  let result;

  try {
    result = normalizeAnalysisResponse(JSON.parse(extractJsonText(rawText)));
  } catch (error) {
    console.error("[Gemini] Analysis JSON parsing failed.", {
      message: error instanceof Error ? error.message : "Unknown parsing error.",
      rawResponse: typeof rawText === "string" ? rawText : "<non-text Gemini response>",
    });
    throw new GeminiResponseError("Gemini returned an invalid JSON analysis response.");
  }

  // The timestamp is operational metadata and must be owned by the server.
  if (result?.metadata && typeof result.metadata === "object") {
    result.metadata.generated_at = new Date().toISOString();
  }

  const validation = validateAnalysisResponse(result);
  const momentMatches = result?.metadata?.moment_id === expectedMomentId;

  if (!validation.valid || !momentMatches) {
    const issues = momentMatches
      ? validation.issues
      : [...validation.issues, "metadata.moment_id does not match the submitted executive moment."];
    console.error("[Gemini] Analysis schema validation failed.", {
      issues,
      responseKeys: result && typeof result === "object" ? Object.keys(result) : [],
      expectedMomentId,
      receivedMomentId: result?.metadata?.moment_id,
      invalidFieldDiagnostics: {
        growthOpportunityGuidance: describeTextValue(result?.growth_opportunities?.[0]?.guidance),
        executiveRewriteNote: describeTextValue(result?.executive_rewrite?.note),
      },
    });
    throw new GeminiResponseError("Gemini returned an analysis response that does not match the Vaani report schema.");
  }

  return result;
}

export async function analyzeWithGemini(input, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const gemini = new GoogleGenAI({ apiKey });
  let lastError;
  const retryLimit = Number.isInteger(options.maxRetries) ? options.maxRetries : maxRetries;
  const request = input
    ? {
        model: "gemini-3.5-flash",
        contents: [
          { inlineData: { mimeType: input.audio.mimeType, data: input.audio.data } },
          { text: buildAnalysisPrompt(input.context) },
        ],
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: analysisResponseJsonSchema,
        },
      }
    : {
        model: "gemini-3.5-flash",
        contents: "Reply with the single word: healthy",
      };

  for (let attempt = 0; attempt <= retryLimit; attempt += 1) {
    try {
      const response = await gemini.models.generateContent(request);
      return input ? parseAnalysisResponse(response, input.context.selectedExecutiveMoment) : response;
    } catch (error) {
      lastError = error;
      const status = getErrorStatus(error);
      console.error("[Gemini] Analysis request failed.", {
        attempt: attempt + 1,
        status: status ?? 502,
        message: error instanceof Error ? error.message : "Unknown Gemini error.",
      });

      if (status !== 503 || attempt === retryLimit) break;
      await wait(500 * 2 ** attempt);
    }
  }

  throw lastError;
}
