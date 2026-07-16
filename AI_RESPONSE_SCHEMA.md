# Vaani AI Response Schema

## Purpose

This document defines the complete, versioned response contract for a future Vaani executive-coaching analysis. It is a data contract only. The response must be validated server-side before it is stored or shown in the Results dashboard.

## Response Shape

```json
{
  "overall_score": 82,
  "executive_readiness": {
    "level": "ready_with_opportunities",
    "label": "Ready with Improvement Opportunities",
    "summary": "Your message is clear and professional, with an opportunity to lead more directly with business impact."
  },
  "score_breakdown": [
    {
      "criterion": "Executive Clarity",
      "score": 86,
      "rationale": "The main point is understandable and supported by relevant detail."
    }
  ],
  "strengths": [
    {
      "title": "Clear articulation",
      "evidence": "You stated the outcome of your work early in the response.",
      "impact": "This makes your contribution easier for senior stakeholders to follow."
    }
  ],
  "growth_opportunities": [
    {
      "title": "Lead with the business outcome",
      "guidance": "Open with the measurable result before explaining the work behind it.",
      "priority": "high"
    }
  ],
  "executive_rewrite": {
    "title": "A Stronger Opening",
    "before": "I wanted to share a few things I have been working on.",
    "after": "I would like to outline the impact delivered and the leadership scope I am ready to own next.",
    "note": "Use this as a direction for practice, not a script to memorize."
  },
  "practice_plan": {
    "next_focus": "Open with the business outcome in your first sentence.",
    "exercise": "Record a 30-second opening that names the outcome, evidence, and next ask.",
    "success_measure": "The opening states one outcome and one clear ask in under 30 seconds."
  },
  "metadata": {
    "schema_version": "1.0",
    "moment_id": "promotion-appraisal",
    "rubric_version": "1.0",
    "analysis_status": "complete",
    "generated_at": "2026-07-16T10:30:00Z",
    "limitations": []
  }
}
```

## Top-Level Fields

### `overall_score`

- **Purpose:** Provides a single, high-level indication of executive communication readiness.
- **Type:** Integer.
- **Example:** `82`.
- **Constraints:** Required; range `0`–`100`; must be consistent with the submitted score breakdown; must not be produced when analysis status is not `complete`.

### `executive_readiness`

- **Purpose:** Converts the overall score into an understandable executive-readiness assessment.
- **Type:** Object.
- **Example:** `{ "level": "ready_with_opportunities", "label": "Ready with Improvement Opportunities", "summary": "Your message is clear and professional..." }`.
- **Constraints:** Required; contains only the fields below; summary must be grounded in the submitted transcript and must not make claims about personality, promotion outcomes, or protected characteristics.

#### `executive_readiness.level`

- **Purpose:** Supplies a stable machine-readable readiness category.
- **Type:** String enum.
- **Example:** `"ready_with_opportunities"`.
- **Constraints:** Required; one of `needs_foundation`, `developing`, `ready_with_opportunities`, or `strong_readiness`.

#### `executive_readiness.label`

- **Purpose:** Supplies the human-readable label for the readiness category.
- **Type:** String.
- **Example:** `"Ready with Improvement Opportunities"`.
- **Constraints:** Required; maximum 60 characters; must correspond to `level` using a server-owned mapping.

#### `executive_readiness.summary`

- **Purpose:** Gives the user a concise assessment of their executive impact.
- **Type:** String.
- **Example:** `"Your message is clear and professional, with an opportunity to lead more directly with business impact."`.
- **Constraints:** Required; 1–3 sentences; maximum 450 characters; specific to the submitted response; no unsupported diagnosis or prediction.

### `score_breakdown`

- **Purpose:** Provides the moment-specific scores that power the Results score bars.
- **Type:** Array of score-breakdown objects.
- **Example:** `[{ "criterion": "Executive Clarity", "score": 86, "rationale": "The main point is understandable..." }]`.
- **Constraints:** Required; exactly the three criteria configured for the selected executive moment; no duplicate criteria; each entry must use the fields below.

#### `score_breakdown[].criterion`

- **Purpose:** Names the communication criterion being evaluated.
- **Type:** String.
- **Example:** `"Executive Clarity"`.
- **Constraints:** Required; must exactly match a server-defined criterion for the selected `metadata.moment_id`; maximum 80 characters.

#### `score_breakdown[].score`

- **Purpose:** Gives the numeric score for one criterion.
- **Type:** Integer.
- **Example:** `86`.
- **Constraints:** Required; range `0`–`100`; must be explainable by the corresponding rationale; must not be treated as a clinical, employment, or personality assessment.

#### `score_breakdown[].rationale`

- **Purpose:** Explains the score using observable communication choices.
- **Type:** String.
- **Example:** `"The main point is understandable and supported by relevant detail."`.
- **Constraints:** Required; 1–2 sentences; maximum 300 characters; refer only to the submitted response and selected context.

### `strengths`

- **Purpose:** Identifies communication choices that the user should retain.
- **Type:** Array of strength objects.
- **Example:** `[{ "title": "Clear articulation", "evidence": "You stated the outcome...", "impact": "This makes your contribution..." }]`.
- **Constraints:** Required; 2–3 items; ordered from highest to lowest value; each item must include the fields below; strengths must be evidence-based rather than generic praise.

#### `strengths[].title`

- **Purpose:** Names a positive communication behavior.
- **Type:** String.
- **Example:** `"Clear articulation"`.
- **Constraints:** Required; maximum 80 characters; must describe an observable behavior or outcome.

#### `strengths[].evidence`

- **Purpose:** Connects the strength to something present in the response.
- **Type:** String.
- **Example:** `"You stated the outcome of your work early in the response."`.
- **Constraints:** Required; maximum 300 characters; transcript-grounded; do not invent quotations.

#### `strengths[].impact`

- **Purpose:** Explains why the behavior matters in an executive setting.
- **Type:** String.
- **Example:** `"This makes your contribution easier for senior stakeholders to follow."`.
- **Constraints:** Required; maximum 250 characters; must be practical and non-speculative.

### `growth_opportunities`

- **Purpose:** Prioritizes changes that would most improve the next practice attempt.
- **Type:** Array of growth-opportunity objects.
- **Example:** `[{ "title": "Lead with the business outcome", "guidance": "Open with the measurable result...", "priority": "high" }]`.
- **Constraints:** Required; 2–3 items; ordered by priority; each item must be actionable, respectful, and limited to communication behavior.

#### `growth_opportunities[].title`

- **Purpose:** States the improvement area in concise language.
- **Type:** String.
- **Example:** `"Lead with the business outcome"`.
- **Constraints:** Required; maximum 100 characters; framed as a coachable behavior rather than a personal judgment.

#### `growth_opportunities[].guidance`

- **Purpose:** Gives an actionable recommendation for improvement.
- **Type:** String.
- **Example:** `"Open with the measurable result before explaining the work behind it."`.
- **Constraints:** Required; maximum 350 characters; specific enough to rehearse in the next attempt; no vague advice such as “be more confident.”

#### `growth_opportunities[].priority`

- **Purpose:** Supports visual ordering and focus in the Results dashboard.
- **Type:** String enum.
- **Example:** `"high"`.
- **Constraints:** Required; one of `high`, `medium`, or `low`; at least one opportunity must be `high`.

### `executive_rewrite`

- **Purpose:** Gives a concise, optional example of a stronger way to frame a key portion of the response.
- **Type:** Object.
- **Example:** `{ "title": "A Stronger Opening", "before": "I wanted to share...", "after": "I would like to outline...", "note": "Use this as a direction..." }`.
- **Constraints:** Required; must contain the fields below; represents coaching guidance, not generated evidence or a guaranteed outcome.

#### `executive_rewrite.title`

- **Purpose:** Names the portion of communication being improved.
- **Type:** String.
- **Example:** `"A Stronger Opening"`.
- **Constraints:** Required; maximum 80 characters.

#### `executive_rewrite.before`

- **Purpose:** Presents the original phrasing or a faithful concise paraphrase for comparison.
- **Type:** String.
- **Example:** `"I wanted to share a few things I have been working on."`.
- **Constraints:** Required; maximum 500 characters; must be verbatim from the transcript or clearly treated as a faithful paraphrase by the server-side prompt.

#### `executive_rewrite.after`

- **Purpose:** Shows a stronger example that applies the coaching guidance.
- **Type:** String.
- **Example:** `"I would like to outline the impact delivered and the leadership scope I am ready to own next."`.
- **Constraints:** Required; maximum 500 characters; must preserve the user’s intended meaning; must not invent achievements, metrics, or business facts.

#### `executive_rewrite.note`

- **Purpose:** Clarifies how the user should use the example.
- **Type:** String.
- **Example:** `"Use this as a direction for practice, not a script to memorize."`.
- **Constraints:** Required; maximum 200 characters; must discourage verbatim dependence on the rewrite.

### `practice_plan`

- **Purpose:** Turns the report into a focused next rehearsal.
- **Type:** Object.
- **Example:** `{ "next_focus": "Open with the business outcome...", "exercise": "Record a 30-second opening...", "success_measure": "The opening states..." }`.
- **Constraints:** Required; contains only the fields below; one achievable plan for the next attempt.

#### `practice_plan.next_focus`

- **Purpose:** Identifies the most valuable single behavior to improve next.
- **Type:** String.
- **Example:** `"Open with the business outcome in your first sentence."`.
- **Constraints:** Required; maximum 200 characters; must align with a growth opportunity.

#### `practice_plan.exercise`

- **Purpose:** Describes a short practical rehearsal activity.
- **Type:** String.
- **Example:** `"Record a 30-second opening that names the outcome, evidence, and next ask."`.
- **Constraints:** Required; maximum 350 characters; must be feasible without external tools beyond Vaani’s practice flow.

#### `practice_plan.success_measure`

- **Purpose:** Defines what a successful next attempt looks like.
- **Type:** String.
- **Example:** `"The opening states one outcome and one clear ask in under 30 seconds."`.
- **Constraints:** Required; maximum 250 characters; concrete, observable, and measurable.

### `metadata`

- **Purpose:** Records non-display operational context required for validation, traceability, and safe rendering.
- **Type:** Object.
- **Example:** `{ "schema_version": "1.0", "moment_id": "promotion-appraisal", "rubric_version": "1.0", "analysis_status": "complete", "generated_at": "2026-07-16T10:30:00Z", "limitations": [] }`.
- **Constraints:** Required; must contain the fields below; no user email, raw audio, API keys, or sensitive account data.

#### `metadata.schema_version`

- **Purpose:** Identifies the response contract version.
- **Type:** String.
- **Example:** `"1.0"`.
- **Constraints:** Required; semantic version string; must be supported by the receiving application.

#### `metadata.moment_id`

- **Purpose:** Identifies the executive moment used to choose the rubric.
- **Type:** String enum.
- **Example:** `"promotion-appraisal"`.
- **Constraints:** Required; must match a server-defined Vaani executive-moment ID; never use a user-entered title as the identifier.

#### `metadata.rubric_version`

- **Purpose:** Identifies the scoring rubric used for the response.
- **Type:** String.
- **Example:** `"1.0"`.
- **Constraints:** Required; semantic version string; immutable once a result is saved.

#### `metadata.analysis_status`

- **Purpose:** Declares whether the response can be presented as a completed report.
- **Type:** String enum.
- **Example:** `"complete"`.
- **Constraints:** Required; one of `complete`, `insufficient_input`, or `failed`; a report with `insufficient_input` or `failed` must not include fabricated scores or coaching content.

#### `metadata.generated_at`

- **Purpose:** Records when the response was generated.
- **Type:** String in ISO 8601 UTC date-time format.
- **Example:** `"2026-07-16T10:30:00Z"`.
- **Constraints:** Required; generated by the server; must be a valid UTC timestamp.

#### `metadata.limitations`

- **Purpose:** Communicates material limitations in the source input or analysis.
- **Type:** Array of strings.
- **Example:** `["The response was brief, so pacing could not be assessed reliably."]`.
- **Constraints:** Required; may be empty; each item maximum 250 characters; include only concrete analysis limitations, not generic disclaimers.

## Validation Rules

- Reject unknown top-level fields unless a future schema version explicitly permits them.
- Reject a response when required fields are absent, types are invalid, enum values are unsupported, or text exceeds the stated limits.
- Reject or replace a completed response if it contains scores without a matching selected moment and rubric.
- Render only validated content. For `failed` and `insufficient_input` statuses, show a recovery state rather than a partial scorecard.
- Preserve this contract version with every stored result so future rubric and prompt changes remain traceable.
