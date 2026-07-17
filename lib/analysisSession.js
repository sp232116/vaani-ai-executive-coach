"use client";

let pendingAnalysis;

export function startAnalysisRequest({ audio, context }) {
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
    const responseData = responseText ? JSON.parse(responseText) : null;

    if (!response.ok) {
      throw new Error(responseData?.message || responseData?.error || "Analysis failed.");
    }

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
