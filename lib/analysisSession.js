"use client";

let pendingAnalysis;
const temporaryAnalysisError = "Vaani is temporarily unable to complete the analysis. Please try again.";

function parseJsonResponse(responseText) {
  if (!responseText) return null;

  try {
    return JSON.parse(responseText);
  } catch {
    return null;
  }
}

export function startAnalysisRequest({ audio, context }) {
  if (pendingAnalysis) return pendingAnalysis;

  const formData = new FormData();

  formData.set("audio", audio);
  formData.set("selected_executive_moment", context.selectedMoment);
  formData.set("conversation_type", context.conversationType);
  formData.set("audience", context.audience);
  formData.set("desired_outcome", context.desiredOutcome);
  formData.set("worries", JSON.stringify(context.worries));

  pendingAnalysis = fetch("/api/analyze", {
    method: "POST",
    body: formData,
  }).then(async (response) => {
    const responseText = await response.text();
    const responseData = parseJsonResponse(responseText);

    if (!response.ok) {
      throw new Error(responseData?.message || responseData?.error || temporaryAnalysisError);
    }

    if (!responseData) throw new Error(temporaryAnalysisError);

    return responseData;
  });

  return pendingAnalysis;
}

export function getPendingAnalysis() {
  return pendingAnalysis;
}

export function clearPendingAnalysis() {
  pendingAnalysis = undefined;
}
